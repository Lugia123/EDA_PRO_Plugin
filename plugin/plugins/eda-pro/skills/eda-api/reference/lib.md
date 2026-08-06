# LIB_* — 库（器件、符号、封装、3D 模型、分类、复用模块）

## LIB_3DModel

调用：`eda.lib_3DModel.xxx()`

- `create(libraryUuid: string, modelFile: Blob, classification?: ILIB_ClassificationIndex | Array<string>, unit?: ESYS_Unit.MILLIMETER | ESYS_Unit.CENTIMETER | ESYS_Unit.METER | ESYS_Unit.MIL | ESYS_Unit` — 创建 3D 模型
- `delete(modelUuid: string, libraryUuid: string): Promise<boolean>;` — 删除 3D 模型
- `modify(modelUuid: string, libraryUuid: string, modelName?: string, classification?: ILIB_ClassificationIndex | Array<string> | null, description?: string | null): Promise<boolean>;` — 修改 3D 模型
- `get(modelUuid: string, libraryUuid?: string): Promise<ILIB_3DModelItem | undefined>;` — 获取 3D 模型的所有属性
- `copy(modelUuid: string, libraryUuid: string, targetLibraryUuid: string, targetClassification?: ILIB_ClassificationIndex | Array<string>, newModelName?: string): Promise<string | undefined>;` — 复制 3D 模型
- `search(key: string, libraryUuid?: string, classification?: ILIB_ClassificationIndex | Array<string>, itemsOfPage?: number, page?: number): Promise<Array<ILIB_3DModelSearchItem>>;` — 搜索 3D 模型

## LIB_Cbb

调用：`eda.lib_Cbb.xxx()`

- `create(libraryUuid: string, cbbName: string, classification?: ILIB_ClassificationIndex | Array<string>, description?: string): Promise<string | undefined>;` — 创建复用模块
- `delete(cbbUuid: string, libraryUuid: string): Promise<boolean>;` — 删除复用模块
- `modify(cbbUuid: string, libraryUuid: string, cbbName?: string, classification?: ILIB_ClassificationIndex | Array<string> | null, description?: string | null): Promise<boolean>;` — 修改复用模块
- `get(cbbUuid: string, libraryUuid?: string): Promise<ILIB_CbbItem | undefined>;` — 获取复用模块的所有属性
- `copy(cbbUuid: string, libraryUuid: string, targetLibraryUuid: string, targetClassification?: ILIB_ClassificationIndex | Array<string>, newCbbName?: string): Promise<string | undefined>;` — 复制复用模块
- `search(key: string, libraryUuid?: string, classification?: ILIB_ClassificationIndex | Array<string>, itemsOfPage?: number, page?: number): Promise<Array<ILIB_CbbSearchItem>>;` — 搜索复用模块
- `openProjectInEditor(cbbUuid: string, libraryUuid: string): Promise<boolean>;` — 在编辑器打开复用模块工程
- `openSymbolInEditor(cbbUuid: string, libraryUuid: string, splitScreenId?: string): Promise<string | undefined>;` — 在编辑器打开复用模块符号

## LIB_Classification

调用：`eda.lib_Classification.xxx()`

- `createPrimary(libraryUuid: string, libraryType: ELIB_LibraryType, primaryClassificationName: string): Promise<ILIB_ClassificationIndex | undefined>;` — 创建一级分类
- `createSecondary(libraryUuid: string, libraryType: ELIB_LibraryType, primaryClassificationUuid: string, secondaryClassificationName: string): Promise<ILIB_ClassificationIndex | undefined>;` — 创建二级分类
- `getIndexByName(libraryUuid: string, libraryType: ELIB_LibraryType, primaryClassificationName: string, secondaryClassificationName?: string): Promise<ILIB_ClassificationIndex | undefined>;` — 获取指定名称的分类的分类索引
- `getNameByUuid(libraryUuid: string, libraryType: ELIB_LibraryType, primaryClassificationUuid: string, secondaryClassificationUuid?: string): Promise<{` — 获取指定 UUID 的分类的名称
- `getNameByIndex(classificationIndex: ILIB_ClassificationIndex): Promise<{` — 获取指定索引的分类的名称
- `getAllClassificationTree(libraryUuid: string, libraryType: ELIB_LibraryType): Promise<Array<{` — 获取所有分类信息组成的树
- `deleteByUuid(libraryUuid: string, classificationUuid: string): Promise<boolean>;` — 删除指定 UUID 的分类
- `deleteByIndex(classificationIndex: ILIB_ClassificationIndex): Promise<boolean>;` — 删除指定索引的分类

## LIB_Device

调用：`eda.lib_Device.xxx()`

- `create(libraryUuid: string, deviceName: string, classification?: ILIB_ClassificationIndex | Array<string>, association?: {` — 创建器件
- `delete(deviceUuid: string, libraryUuid: string): Promise<boolean>;` — 删除器件
- `modify(deviceUuid: string, libraryUuid: string, deviceName?: string, classification?: ILIB_ClassificationIndex | Array<string> | null, association?: {` — 修改器件
- `get(deviceUuid: string, libraryUuid?: string): Promise<ILIB_DeviceItem | undefined>;` — 获取器件的所有属性
- `copy(deviceUuid: string, libraryUuid: string, targetLibraryUuid: string, targetClassification?: ILIB_ClassificationIndex | Array<string>, newDeviceName?: string): Promise<string | undefined>;` — 复制器件
- `search(key: string, libraryUuid?: string, classification?: ILIB_ClassificationIndex | Array<string>, symbolType?: ELIB_SymbolType, itemsOfPage?: number, page?: number): Promise<Array<ILIB_DeviceSearch` — 搜索器件
- `searchByProperties(properties: ILIB_DevicePropertiesForSearch, libraryUuid?: string, classification?: Array<string>, symbolType?: ELIB_SymbolType, itemsOfPage?: number, page?: number): Promise<Array<I` — ADD since EDA v4
- `getByLcscIds(lcscIds: Array<string>, libraryUuid?: string, allowMultiMatch?: boolean): Promise<Array<ILIB_DeviceSearchItem>>;` — 私有化部署环境暂无法使用本接口

## LIB_Footprint

调用：`eda.lib_Footprint.xxx()`

- `create(libraryUuid: string, footprintName: string, classification?: ILIB_ClassificationIndex | Array<string>, description?: string): Promise<string | undefined>;` — 创建封装
- `delete(footprintUuid: string, libraryUuid: string): Promise<boolean>;` — 删除封装
- `modify(footprintUuid: string, libraryUuid: string, footprintName?: string, classification?: ILIB_ClassificationIndex | Array<string> | null, description?: string | null): Promise<boolean>;` — 修改封装
- `updateDocumentSource(footprintUuid: string, libraryUuid: string, documentSource: string): Promise<boolean | undefined>;` — 更新封装的文档源码
- `get(footprintUuid: string, libraryUuid?: string): Promise<ILIB_FootprintItem | undefined>;` — 获取封装的所有属性
- `copy(footprintUuid: string, libraryUuid: string, targetLibraryUuid: string, targetClassification?: ILIB_ClassificationIndex | Array<string>, newFootprintName?: string): Promise<string | undefined>;` — 复制封装
- `search(key: string, libraryUuid?: string, classification?: ILIB_ClassificationIndex | Array<string>, itemsOfPage?: number, page?: number): Promise<Array<ILIB_FootprintSearchItem>>;` — 搜索封装
- `searchByProperties(properties: ILIB_FootprintPropertiesForSearch, libraryUuid?: string): Promise<Array<ILIB_FootprintSearchItem>>;` — 使用属性精确搜索封装
- `openInEditor(footprintUuid: string, libraryUuid: string, splitScreenId?: string): Promise<string | undefined>;` — 在编辑器打开文档
- `getRenderImage(source: {` — 获取封装渲染图

## LIB_LibrariesList

调用：`eda.lib_LibrariesList.xxx()`

- `getSystemLibraryUuid(): Promise<string | undefined>;` — 获取系统库的 UUID
- `getPersonalLibraryUuid(): Promise<string | undefined>;` — 获取个人库的 UUID
- `getProjectLibraryUuid(): Promise<string | undefined>;` — 获取工程库的 UUID
- `getFavoriteLibraryUuid(): Promise<string | undefined>;` — 获取收藏库的 UUID
- `getAllLibrariesList(): Promise<Array<ILIB_LibraryInfo>>;` — 获取所有库的列表
- `registerExtendLibrary(title: string, libraryFunctions: {` — 注册外部库

## LIB_PanelLibrary

调用：`eda.lib_PanelLibrary.xxx()`

- `create(libraryUuid: string, panelLibraryName: string, classification?: ILIB_ClassificationIndex | Array<string>, description?: string): Promise<string | undefined>;` — 创建面板库
- `delete(panelLibraryUuid: string, libraryUuid: string): Promise<boolean>;` — 删除面板库
- `modify(panelLibraryUuid: string, libraryUuid: string, panelLibraryName?: string, classification?: ILIB_ClassificationIndex | Array<string> | null, description?: string | null): Promise<boolean>;` — 修改面板库
- `get(panelLibraryUuid: string, libraryUuid?: string): Promise<ILIB_PanelLibraryItem | undefined>;` — 获取面板库的所有属性
- `copy(panelLibraryUuid: string, libraryUuid: string, targetLibraryUuid: string, targetClassification?: ILIB_ClassificationIndex | Array<string>, newPanelLibraryName?: string): Promise<string | undefine` — 复制面板库
- `search(key: string, libraryUuid?: string, classification?: ILIB_ClassificationIndex | Array<string>, itemsOfPage?: number, page?: number): Promise<Array<ILIB_PanelLibrarySearchItem>>;` — 搜索面板库
- `openInEditor(panelLibraryUuid: string, libraryUuid: string, splitScreenId?: string): Promise<string | undefined>;` — 在编辑器打开文档

## LIB_SelectControl

调用：`eda.lib_SelectControl.xxx()`

- `getSelectedLibraryRowInfo(): Promise<ILIB_LibraryItem | undefined>;` — 获取当前底部库选中行的信息

## LIB_SimulationModel

调用：`eda.lib_SimulationModel.xxx()`

- `create(libraryUuid: string, model: {` — 创建仿真模型
- `delete(simulationModelUuid: string, libraryUuid: string): Promise<boolean>;` — 删除仿真模型
- `modify(simulationModelUuid: string, libraryUuid: string, modelProps?: {` — ADD since EDA v3.2.167
- `get(simulationModelUuid: string, libraryUuid?: string): Promise<ILIB_SimulationModelItem | undefined>;` — ADD since EDA v3.2.167
- `copy(simulationModelUuid: string, libraryUuid: string, targetLibraryUuid: string, targetClassification?: Array<string>, newSimulationModelName?: string): Promise<string | undefined>;` — 复制仿真模型
- `search(key: string, libraryUuid?: string, classification?: Array<string>, simulationModelType?: ELIB_SimulationModelType, itemsOfPage?: number, page?: number): Promise<Array<ILIB_SimulationModelSearch` — 搜索仿真模型

## LIB_Symbol

调用：`eda.lib_Symbol.xxx()`

- `create(libraryUuid: string, symbolName: string, classification?: ILIB_ClassificationIndex | Array<string>, symbolType?: ELIB_SymbolType, description?: string): Promise<string | undefined>;` — 创建符号
- `delete(symbolUuid: string, libraryUuid: string): Promise<boolean>;` — 删除符号
- `modify(symbolUuid: string, libraryUuid: string, symbolName?: string, classification?: ILIB_ClassificationIndex | Array<string> | null, description?: string | null): Promise<boolean>;` — 修改符号
- `updateDocumentSource(symbolUuid: string, libraryUuid: string, documentSource: string): Promise<boolean | undefined>;` — 更新符号的文档源码
- `get(symbolUuid: string, libraryUuid?: string): Promise<ILIB_SymbolItem | undefined>;` — 获取符号的所有属性
- `copy(symbolUuid: string, libraryUuid: string, targetLibraryUuid: string, targetClassification?: ILIB_ClassificationIndex | Array<string>, newSymbolName?: string): Promise<string | undefined>;` — 复制符号
- `search(key: string, libraryUuid?: string, classification?: ILIB_ClassificationIndex | Array<string>, symbolType?: ELIB_SymbolType, itemsOfPage?: number, page?: number): Promise<Array<ILIB_SymbolSearch` — 搜索符号
- `searchByProperties(properties: ILIB_SymbolPropertiesForSearch, libraryUuid?: string): Promise<Array<ILIB_SymbolSearchItem>>;` — 使用属性精确搜索符号
- `openInEditor(symbolUuid: string, libraryUuid: string, splitScreenId?: string): Promise<string | undefined>;` — 在编辑器打开文档
- `getRenderImage(source: {` — 获取符号渲染图
