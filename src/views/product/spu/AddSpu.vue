<template>
    <div class="addspu_container">
        <el-card>
            <el-form size="large" :model="spuForm" :rules="spuRules" ref="spuForms" label-width="96">
                <!-- SPU名称 -->
                <el-form-item label="SPU名称" prop="spuName">
                    <el-input v-model="spuForm.spuName" placeholder="请输入SPU名称"></el-input>
                </el-form-item>
                <!-- SPU品牌 -->
                <el-form-item label="SPU品牌" prop="tmId">
                    <el-select v-model="spuForm.tmId" placeholder="请选择品牌" size="large">
                        <el-option v-for="item in tmList" :key="item.id" :label="item.tmName" :value="item.id" />
                    </el-select>
                </el-form-item>
                <!-- SPU描述 -->
                <el-form-item label="SPU描述">
                    <el-input v-model="spuForm.description" :autosize="{ minRows: 4, maxRows: 8 }" type="textarea"
                        placeholder="请输入SPU描述" />
                </el-form-item>
                <!-- SPU图标 -->
                <el-form-item label="SPU图标">
                    <el-upload v-model:file-list="spuImageList" :http-request="handleHttpRequest"
                        list-type="picture-card" :on-preview="handlePictureCardPreview" :on-remove="handleRemove" :on-success="handleUploadSuccess"
                        :auto-upload="true">
                        <el-icon>
                            <Plus />
                        </el-icon>
                    </el-upload>

                    <el-dialog v-model="dialogVisible" width="32%">
                        <img class="dialog_img" :src="dialogImageUrl" />
                    </el-dialog>
                </el-form-item>
                <!-- SPU销售属性 -->
                <el-form-item label="SPU销售属性">
                    <!-- 添加属性选择框 -->
                    <el-select v-model="spuSaleAttrId" :placeholder="spuAttrPlaceholder" size="large">
                        <el-option v-for="item in attrList" :key="item.id" :label="item.name" :value="item.id" />
                    </el-select>
                    <!-- 添加属性按钮 -->
                    <el-button :disabled="!spuSaleAttrId" type="primary" size="large" icon="Plus" style="margin-left: 20px;"
                        @click="handleAddSpuAttr">添加属性</el-button>
                    <!-- 属性表格 -->
                    <el-table style="margin-top: 20px;" :data="spuSaleAttrList" border stripe>
                        <!-- 序号 -->
                        <el-table-column type="index" label="序号" width="120" align="center" />
                        <!-- 销售属性名称 -->
                        <el-table-column prop="saleAttrName" label="销售属性名称" width="200" align="center" />
                        <!-- 销售属性值 -->
                        <el-table-column prop="prop" label="销售属性值" width="width" align="left">
                            <template #="{ row }">
                                <el-tag style="margin-right: 10px;" v-for="(item, index) in row.spuSaleAttrValueList"
                                    :key="index" closable :disable-transitions="false" @close="handleClose(item, row)">
                                    {{ item.saleAttrValueName }}
                                </el-tag>
                                <el-input v-if="row.flag" ref="InputRef" v-model="valueName" size="default"
                                    placeholder="请输入属性值" style="display: inline;" @blur="handleInputConfirm(row)" />
                                <el-button v-else size="default" icon="Plus" @click="handleAddSpuAttrValueName(row)" />
                            </template>
                        </el-table-column>
                        <!-- 操作 -->
                        <el-table-column prop="prop" label="销售属性值" width="200" align="center">
                            <template #="{ row }">
                                <el-button type="danger" size="default" icon="Delete"
                                    @click="deleteSpuAttr(row)"></el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-form-item>
                <el-form-item>
                    <el-button :disabled="spuSaleAttrList.length < 1" type="primary" size="large"
                        @click=handleSave>保存</el-button>
                    <el-button size="large" @click="handleCancel">取消</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { reqGetTrademark } from "@/api/product/trademark"
import { reqGetBaseSaleAttrList, reqGetSpuImgList, reqGetSpuAttrList } from '@/api/product/spu'
import { onMounted, ref, reactive, computed, nextTick, onBeforeUnmount, watch } from 'vue';
import { ElMessage } from 'element-plus'
import $bus from '@/bus'
import useProductStore from '@/store/modules/product'



const productStore = useProductStore()
const spuInfo = defineProps(['spuInfo'])
let tmList = ref<any>([]) // 品牌列表
let attrList = ref<any>([]) // 销售属性列表
let attrListCopy = ref<any>([]) // 备份销售属性列表
let spuForm = reactive<any>({ // spu表单
    spuName: "", // spu名称
    tmId: null, // 所属品牌id
    description: "", // spu描述
    category3Id: 0, // 三级列表id   
    id: 0
})
let spuForms = ref<any>() // 获取form根节点
//表单验证规则
const spuRules = {
    spuName: [
        { required: true, message: 'spu名称不能为空', trigger: 'change' },
    ],
    tmId: [
        { required: true, message: '品牌不能为空', trigger: 'change' },
    ],
}
let spuImageList = ref<any>([])// 上传的spu图片列表
let spuSaleAttrId = ref<any>(null) // spu的销售属性id
let valueName = ref<any>('') // spu销售属性值
const InputRef = ref<any>() // 获取输入属性值的input元素
let spuSaleAttrList = ref<any>([])// spu销售属性列表（数据库查出来的和新增/删除的都在这个对象里）
let originalSpuSaleAttrList = ref<any>([])// 原始销售属性列表，用于存储数据库查出来的数据

let spuAttrPlaceholder = computed(() => {
    if (attrList.value.length == 3) {
        return '还未选择3个'
    } else if (attrList.value.length == 2) {
        return '还未选择2个'
    } else if (attrList.value.length == 1) {
        return '还未选择1个'
    } else {
        return '暂无数据可选择'
    }
})

const dialogImageUrl = ref<any>('') // 放大后的图片地址
const dialogVisible = ref<any>(false) // 是否放大图片

onMounted(() => {
    getTm()
    getAttrList()
    if (spuInfo.spuInfo) {
        // 修改spu时初始化传递过来的数据
        spuForm.spuName = spuInfo.spuInfo.spuName
        spuForm.tmId = spuInfo.spuInfo.tmId
        spuForm.description = spuInfo.spuInfo.description
        spuForm.id = spuInfo.spuInfo.id
        // 编辑spu时获取图片和销售属性列表数据
        getSpuImgList(spuInfo.spuInfo.id)
        getSpuAttrList(spuInfo.spuInfo.id)
    } else {
        // 新增spu时清空销售属性列表
        spuSaleAttrList.value = []
    }
})

// 组件销毁时清空销售属性列表
onBeforeUnmount(() => {
    spuSaleAttrList.value = []
})

// 监听spuInfo的变化，当spuInfo变化时重新初始化数据
watch(() => spuInfo.spuInfo, (newVal) => {
    if (newVal) {
        // 修改spu时初始化传递过来的数据
        spuForm.spuName = newVal.spuName
        spuForm.tmId = newVal.tmId
        spuForm.description = newVal.description
        spuForm.id = newVal.id
        // 编辑spu时获取图片和销售属性列表数据
        getSpuImgList(newVal.id)
        getSpuAttrList(newVal.id)
    } else {
        // 新增spu时清空所有数据
        spuForm.spuName = ""
        spuForm.tmId = null
        spuForm.description = ""
        spuForm.id = 0
        spuImageList.value = []
        spuSaleAttrList.value = []
        // 重新获取销售属性列表
        getAttrList()
    }
}, { deep: true, immediate: false })


// 移除图片
const handleRemove = (file: any, fileList: any) => {
    if (file.status == 'success' && 'ready') {
        spuImageList.value = fileList.filter((item: any) => item !== file)
    }
}

// 放大图片
const handlePictureCardPreview = (file: any) => {
    dialogImageUrl.value = file.url
    dialogVisible.value = true
}
// 处理上传成功
const handleUploadSuccess = (response: any, file: any) => {
    console.log('上传成功，响应：', response);
    console.log('文件对象：', file);
    if (response.code === 200) {
        file.url = response.url;
        console.log('设置文件URL：', file.url);
    }
}

// 自定义上传方法
import request from '@/utils/request';
const handleHttpRequest = async (options: any) => {
    console.log('自定义上传开始');
    const { file, onSuccess, onError } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await request.post('/admin/product/fileUpload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const res = response as any;
        console.log('上传响应：', res);
        if (res && res.code === 200) {
            onSuccess(res);
        } else {
            onError(new Error(res.message || '上传失败'));
        }
    } catch (error: any) {
        console.error('上传失败：', error);
        onError(error);
    }
}
// 添加spu属性
const handleAddSpuAttr = () => {
    // 检查是否已经添加过该属性
    const isAdded = spuSaleAttrList.value.some((item: any) => item.baseSaleAttrId == spuSaleAttrId.value)
    if (isAdded) {
        ElMessage.error('该属性已经添加过了')
        return
    }
    
    attrList.value = attrList.value.filter((item: any) => {
        if (item.id == spuSaleAttrId.value) { // 当前选中的属性
            const obj = {
                baseSaleAttrId: item.id,
                saleAttrName: item.name,
                flag: false,
                spuSaleAttrValueList: []
            }
            spuSaleAttrList.value.push(obj)
        } else { // 留下未选中的属性
            return item
        }
    })
    spuSaleAttrId.value = null // 清空销售属性选择框
}
// 添加spu属性值
const handleAddSpuAttrValueName = (row: any) => {
    row.flag = true // 隐藏添加按钮
    nextTick(() => {
        InputRef.value.focus()
    })
}
// input失去焦点时触发
const handleInputConfirm = (row: any) => {

    // 输入值为空直接退出函数执行
    if (valueName.value.trim() == '') {
        ElMessage.error('属性值不能为空')
        return;
    }
    // 判断输入值是否重复（只检查当前列表中的）
    const isRepeat = row.spuSaleAttrValueList.some((item: any) => {
        return item.saleAttrValueName == valueName.value
    })
    // 输入值重复直接退出函数执行
    if (isRepeat) {
        ElMessage.error('属性值不能重复')
        return;
    }

    // 检查是否与数据库查出来的销售属性值重复
    const originalAttr = originalSpuSaleAttrList.value.find((attr: any) => attr.baseSaleAttrId == row.baseSaleAttrId)
    if (originalAttr) {
        const isOriginalRepeat = originalAttr.spuSaleAttrValueList.some((item: any) => {
            return item.saleAttrValueName == valueName.value
        })
        if (isOriginalRepeat) {
            ElMessage.error('属性值不能与数据库中的属性值重复')
            return;
        }
    }

    // 添加新属性值
    row.spuSaleAttrValueList.push({ baseSaleAttrId: row.baseSaleAttrId, saleAttrValueName: valueName.value })
    row.flag = false // 显示添加按钮
    valueName.value = '' // 清空记录的input框的值
}
// 删除属性值
const handleClose = (item: any, row: any) => {
    console.log('删除属性值前：', JSON.parse(JSON.stringify(spuSaleAttrList.value)));
    console.log('要删除的属性值：', item);
    console.log('当前销售属性：', row);
    // 遍历销售属性列表，创建一个新的数组，确保Vue能检测到变化
    const newSpuSaleAttrList = spuSaleAttrList.value.map((spuAttrItem: any) => {
        // 找到当前点击那一项销售属性
        if (spuAttrItem.baseSaleAttrId == row.baseSaleAttrId) {
            console.log('找到的销售属性：', spuAttrItem);
            // 遍历当前销售属性下的属性值列表，并过滤掉当前点击的那一项属性值
            // 使用saleAttrValueName来比较，确保能正确过滤
            const newSpuSaleAttrValueList = spuAttrItem.spuSaleAttrValueList.filter((valueItem: any) => {
                // 如果有id，使用id比较，否则使用saleAttrValueName比较
                if (valueItem.id && item.id) {
                    console.log('使用id比较：', valueItem.id, item.id);
                    return valueItem.id !== item.id
                } else {
                    console.log('使用saleAttrValueName比较：', valueItem.saleAttrValueName, item.saleAttrValueName);
                    return valueItem.saleAttrValueName !== item.saleAttrValueName
                }
            })
            console.log('删除属性值后：', JSON.parse(JSON.stringify(newSpuSaleAttrValueList)));
            // 返回一个新的对象，确保Vue能检测到变化
            return {
                ...spuAttrItem,
                spuSaleAttrValueList: newSpuSaleAttrValueList
            }
        } else {
            // 其他属性保持不变
            return spuAttrItem
        }
    })
    // 替换整个数组，确保Vue能检测到变化
    spuSaleAttrList.value = newSpuSaleAttrList
    console.log('删除属性值后整个列表：', JSON.parse(JSON.stringify(spuSaleAttrList.value)));
}
// 删除销售属性
const deleteSpuAttr = (row: any) => {
    // 删除销售属性列表中存入的数据
    spuSaleAttrList.value = spuSaleAttrList.value.filter((item: any) => item.baseSaleAttrId !== row.baseSaleAttrId)
    // 将对应备份的销售属性数据添加到attrList里
    attrListCopy.value.forEach((item: any) => {
        if (item.id == row.baseSaleAttrId) {
            attrList.value.push(item)
        }
    })
}
// 点击取消按钮
const handleCancel = () => {
    // 通知父组件将页面状态切换为'list'
    $bus.emit('cancel')
    // 清空销售属性列表，避免下次打开时数据累加
    spuSaleAttrList.value = []
}
// 点击保存按钮
const handleSave = async () => {
    await spuForms.value.validate() // 等待表单验证通过后在执行下面代码
    // 整理数据
    let imgList = <any>[]
    console.log('保存时的图片列表：', spuImageList.value);
    spuImageList.value.forEach((item: any) => {
        let imgObj = {
            id: item.id,
            imgName: item.name,
            imgUrl: '',
            spuId: item.spuId
        }
        if (item.response) { // 新增图片
            imgObj.imgUrl = item.response.url
            console.log('新增图片，使用response.url：', item.response.url);
        } else if (item.url) { // 原有图片或已处理的新增图片
            imgObj.imgUrl = item.url
            console.log('使用item.url：', item.url);
        } else {
            console.log('跳过无效图片：', item);
            return;
        }
        imgList.push(imgObj)
    })
    console.log('整理后的图片列表：', imgList);
    // 收集数据
    console.log('保存时的销售属性列表：', JSON.parse(JSON.stringify(spuSaleAttrList.value)));
    // 创建一个新的数组，确保传递的数据是最新的
    const newSpuSaleAttrList = spuSaleAttrList.value.map((attr: any) => ({
        ...attr,
        spuSaleAttrValueList: [...attr.spuSaleAttrValueList]
    }))
    const data = {
        spuName: spuForm.spuName,
        description: spuForm.description,
        category3Id: productStore.category3Id,
        tmId: spuForm.tmId,
        spuImageList: imgList,
        spuSaleAttrList: newSpuSaleAttrList,
        id: spuForm.id || undefined
    }
    console.log('保存时的数据：', JSON.parse(JSON.stringify(data)));
    if (spuForm.id) { // 修改spu
        try {
            console.log('开始调用editSpuInfo');
            const result = await productStore.editSpuInfo(data)
            console.log('editSpuInfo调用成功：', result);
            $bus.emit('cancel') // 通知父组件将页面状态切换为'list'
            ElMessage.success('更新成功')
            productStore.getSpuList() // 重新获取spu列表
            // 清空销售属性列表，避免下次打开时数据累加
            spuSaleAttrList.value = []

        } catch (error) {
            console.log('editSpuInfo调用失败：', error);
            ElMessage.error(error)
        }
    } else { // 保存spu
        try {
            console.log('开始调用saveSpuInfo');
            const result = await productStore.saveSpuInfo(data)
            console.log('saveSpuInfo调用成功：', result);
            $bus.emit('cancel') // 通知父组件将页面状态切换为'list'
            ElMessage.success('保存成功')
            productStore.getSpuList() // 重新获取spu列表
            // 清空销售属性列表，避免下次打开时数据累加
            spuSaleAttrList.value = []

        } catch (error) {
            console.log('saveSpuInfo调用失败：', error);
            ElMessage.error(error)
        }
    }

}

// 获取品牌列表
const getTm = async () => {
    const result = await reqGetTrademark()
    if (result.code == 200) {
        tmList.value = result.data
    }
}
// 获取主要销售属性列表
const getAttrList = async () => {
    const result = await reqGetBaseSaleAttrList()
    if (result.code == 200) {
        attrList.value = result.data
        attrListCopy.value = result.data
    }
}
// 获取spu图片列表
const getSpuImgList = async (id: any) => {
    const result: any = await reqGetSpuImgList(id)
    if (result.code == 200) {
        let arr = result.data // 尽量不要对服务器的数据直接进行遍历
        // 由于element-plus的图片列表展示需要有name和url字段
        // 所以这边将服务器数据中的imgName和imgUrl改为name和url
        let imgList = <any>[]
        arr.forEach((item: any) => {
            let obj = {
                id: item.id,
                spuId: item.spuId,
                name: item.imgName,
                url: item.imgUrl
            }
            imgList.push(obj)
        })

        spuImageList.value = imgList
    }
}
// 获取销售属性列表
const getSpuAttrList = async (id: any) => {
    const result: any = await reqGetSpuAttrList(id)
    if (result.code == 200) {
        // 直接替换销售属性列表，避免数据累加
        const data = result.data
        // 存储原始销售属性列表（用于检查是否与数据库中的属性值重复）
        originalSpuSaleAttrList.value = JSON.parse(JSON.stringify(data))
        // 直接赋值给spuSaleAttrList（只有一个对象，数据库查出来的和新增/删除的都在这里面）
        spuSaleAttrList.value = JSON.parse(JSON.stringify(data))
        // 过滤获取的属性列表防止多次选择同个属性
        attrList.value = attrListCopy.value.filter((item1: any) => !spuSaleAttrList.value.some((item2: any) => item1.id === item2.baseSaleAttrId))
    }
}
</script>

<style scoped lang=scss>
.addspu_container {
    width: 100%;
    margin-top: 20px;

    .dialog_img {
        width: 100%;
        height: 100%;
    }

    .sale_attr_value_name {
        background-color: var(--el-color-primary-light-9);
        display: inline;
        padding: 2px 10px;
        color: var(--el-color-primary);
        border-radius: 4px;
        margin-right: 12px;
    }


}
</style>