# PCB_* — PCB（图元、网络、层、DRC、生产数据、多边形运算）

## PCB_Document

调用：`eda.pcb_Document.xxx()`

- `importChanges(uuid?: string): Promise<boolean>;` — 从原理图导入变更
- `importAutoRouteJsonFile(autoRouteFile: File): Promise<boolean>;` — 导入自动布线文件（JSON）
- `importAutoRouteSesFile(autoRouteFile: File): Promise<boolean>;` — 导入自动布线文件（SES）
- `importAutoLayoutJsonFile(autoLayoutFile: File): Promise<boolean>;` — 导入自动布局文件（JSON）
- `save(): Promise<boolean>;` — 保存文档
- `getCalculatingRatlineStatus(): Promise<EPCB_DocumentRatlineCalculatingActiveStatus>;` — 获取当前飞线计算功能状态
- `startCalculatingRatline(): Promise<boolean>;` — 启动飞线计算功能
- `stopCalculatingRatline(): Promise<boolean>;` — 停止飞线计算功能
- `convertCanvasOriginToDataOrigin(x: number, y: number): Promise<{` — 输入画布坐标返回该坐标对应的数据坐标
- `convertDataOriginToCanvasOrigin(x: number, y: number): Promise<{` — 输入数据坐标返回该坐标对应的画布坐标
- `getCanvasOrigin(): Promise<{` — 此处的单位为数据层面单位，在跨度上等同于画布层面的 mil
- `setCanvasOrigin(offsetX: number, offsetY: number): Promise<boolean>;` — 此处的单位为数据层面单位，在跨度上等同于画布层面的 mil
- `navigateToCoordinates(x: number, y: number): Promise<boolean>;` — 此处的单位为数据层面单位，在跨度上等同于画布层面的 mil
- `navigateToRegion(left: number, right: number, top: number, bottom: number): Promise<boolean>;` — 此处的单位为数据层面单位，在跨度上等同于画布层面的 mil
- `getPrimitiveAtPoint(x: number, y: number): Promise<IPCB_Primitive | undefined>;` — 获取坐标点的图元
- `getPrimitivesInRegion(left: number, right: number, top: number, bottom: number, leftToRight?: boolean): Promise<Array<IPCB_Primitive>>;` — 获取区域内所有图元
- `zoomToBoardOutline(): Promise<boolean>;` — 缩放到板框（适应板框）
- `getCurrentFilterConfiguration(): Promise<{` — 获取当前画布过滤器配置
- `clearRouting(type?: 'all' | 'net' | 'connection'): Promise<boolean>;` — 清除布线
- `autoRouting(props?: IPCB_AutoRoutingProps): Promise<IPCB_AutoRoutingResult>;` — });
- `autoLayout(): Promise<IPCB_AutoLayoutResult>;` — 自动布局

## PCB_Drc

调用：`eda.pcb_Drc.xxx()`

- `check(strict: boolean, userInterface: boolean, includeVerboseError: false): Promise<boolean>;` — 检查 DRC
- `check(strict: boolean, userInterface: boolean, includeVerboseError: true): Promise<Array<any>>;` — 检查 DRC
- `getRealTimeDrcStatus(): boolean;` — 获取实时 DRC 检查状态
- `startRealTimeDrc(): boolean;` — 开始实时 DRC 检查
- `stopRealTimeDrc(): boolean;` — 停止实时 DRC 检查
- `getCurrentRuleConfigurationName(): Promise<string | undefined>;` — 获取当前设计规则配置名称
- `getCurrentRuleConfiguration(): Promise<{` — 获取当前设计规则配置
- `getRuleConfiguration(configurationName: string): Promise<{` — 获取指定设计规则配置
- `getAllRuleConfigurations(includeSystem?: boolean): Promise<Array<{` — 获取所有设计规则配置
- `saveRuleConfiguration(ruleConfiguration: {` — 保存设计规则配置
- `renameRuleConfiguration(originalConfigurationName: string, configurationName: string): Promise<boolean>;` — 重命名设计规则配置
- `deleteRuleConfiguration(configurationName: string): Promise<boolean>;` — 删除设计规则配置
- `getDefaultRuleConfigurationName(): Promise<string | undefined>;` — 获取新建 PCB 默认设计规则配置的名称
- `setAsDefaultRuleConfiguration(configurationName: string): Promise<boolean>;` — 设置为新建 PCB 默认设计规则配置
- `overwriteCurrentRuleConfiguration(ruleConfiguration: {` — 覆写当前设计规则配置
- `getNetRules(): Promise<Array<{` — 获取网络规则
- `overwriteNetRules(netRules: Array<{` — 覆写网络规则
- `getNetByNetRules(): Promise<{` — 获取网络-网络规则
- `overwriteNetByNetRules(netByNetRules: {` — 覆写网络-网络规则
- `getRegionRules(): Promise<Array<{` — 获取区域规则
- `overwriteRegionRules(regionRules: Array<{` — 覆写区域规则
- `createNetClass(netClassName: string, nets: Array<string>, color: IPCB_EqualLengthNetGroupItem['color']): Promise<boolean>;` — 创建网络类
- `deleteNetClass(netClassName: string): Promise<boolean>;` — 删除网络类
- `modifyNetClassName(originalNetClassName: string, netClassName: string): Promise<boolean>;` — 修改网络类的名称
- `addNetToNetClass(netClassName: string, net: string | Array<string>): Promise<boolean>;` — 将网络添加到网络类
- `removeNetFromNetClass(netClassName: string, net: string | Array<string>): Promise<boolean>;` — 从网络类中移除网络
- `getAllNetClasses(): Promise<Array<IPCB_NetClassItem>>;` — 获取所有网络类的详细属性
- `createDifferentialPair(differentialPairName: string, positiveNet: string, negativeNet: string): Promise<boolean>;` — 创建差分对
- `deleteDifferentialPair(differentialPairName: string): Promise<boolean>;` — 删除差分对
- `modifyDifferentialPairName(originalDifferentialPairName: string, differentialPairName: string): Promise<boolean>;` — 修改差分对的名称
- `modifyDifferentialPairPositiveNet(differentialPairName: string, positiveNet: string): Promise<boolean>;` — 修改差分对正网络
- `modifyDifferentialPairNegativeNet(differentialPairName: string, negativeNet: string): Promise<boolean>;` — 修改差分对负网络
- `getAllDifferentialPairs(): Promise<Array<IPCB_DifferentialPairItem> | {` — - 返回值类型更改为对象
- `createEqualLengthNetGroup(equalLengthNetGroupName: string, nets: Array<string>, color: IPCB_EqualLengthNetGroupItem['color']): Promise<boolean>;` — 创建等长网络组
- `deleteEqualLengthNetGroup(equalLengthNetGroupName: string): Promise<boolean>;` — 删除等长网络组
- `modifyEqualLengthNetGroupName(originalEqualLengthNetGroupName: string, equalLengthNetGroupName: string): Promise<boolean>;` — 修改等长网络组的名称
- `addNetToEqualLengthNetGroup(equalLengthNetGroupName: string, net: string | Array<string>): Promise<boolean>;` — 将网络添加到等长网络组
- `removeNetFromEqualLengthNetGroup(equalLengthNetGroupName: string, net: string | Array<string>): Promise<boolean>;` — 从等长网络组中移除网络
- `getAllEqualLengthNetGroups(): Promise<Array<IPCB_EqualLengthNetGroupItem>>;` — 获取所有等长网络组的详细属性
- `createPadPairGroup(padPairGroupName: string, padPairs: Array<[string, string]>): Promise<boolean>;` — 创建焊盘对组
- `deletePadPairGroup(padPairGroupName: string): Promise<boolean>;` — 删除焊盘对组
- `modifyPadPairGroupName(originalPadPairGroupName: string, padPairGroupName: string): Promise<boolean>;` — 修改焊盘对组的名称
- `addPadPairToPadPairGroup(padPairGroupName: string, padPair: [string, string] | Array<[string, string]>): Promise<boolean>;` — 将焊盘对添加到焊盘对组
- `removePadPairFromPadPairGroup(padPairGroupName: string, padPair: [string, string] | Array<[string, string]>): Promise<boolean>;` — 从焊盘对组中移除焊盘对
- `getAllPadPairGroups(): Promise<Array<IPCB_PadPairGroupItem>>;` — 获取所有焊盘对组的详细属性
- `getPadPairGroupMinWireLength(padPairGroupName: string): Promise<Array<IPCB_PadPairMinWireLengthItem>>;` — 获取焊盘对组最短导线长度

## PCB_Event

调用：`eda.pcb_Event.xxx()`

- `addMouseEventListener(id: string, eventType: 'all' | EPCB_MouseEventType, callFn: (eventType: EPCB_MouseEventType, props: [` — 新增鼠标事件监听
- `addPrimitiveEventListener(id: string, eventType: 'all' | EPCB_PrimitiveEventType, callFn: (eventType: EPCB_PrimitiveEventType, props: [` — 新增图元事件监听
- `addNetEventListener(id: string, eventType: 'all' | EPCB_NetEventType, callFn: (eventType: EPCB_NetEventType, props: [{` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `addCrossProbeSelectEventListener(id: string, callFn: (props: any) => void | Promise<void>): void;` — 新增交叉选择事件监听
- `addRealTimeDrcResultEventListener(id: string, eventType: 'all', callFn: (eventType: undefined, props: [{` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `addRayTracerEngine3DViewClickMaterialEventListener(id: string, callFn: (props: {` — ADD since EDA v4
- `addRayTracerEngine3DViewCameraChangeEventListener(id: string, callFn: (props: {` — ADD since EDA v4
- `removeEventListener(id: string): boolean;` — 移除事件监听
- `isEventListenerAlreadyExist(id: string): boolean;` — 查询事件监听是否存在

## PCB_Layer

调用：`eda.pcb_Layer.xxx()`

- `getCurrentLayer(): IPCB_LayerItem | undefined;` — 获取当前图层的详细属性
- `selectLayer(layer: TPCB_LayersInTheSelectable): Promise<boolean>;` — 选中图层
- `setLayerVisible(layer?: TPCB_LayersInTheSelectable | Array<TPCB_LayersInTheSelectable>, setOtherLayerInvisible?: boolean): Promise<boolean>;` — 将层设置为可见
- `setLayerInvisible(layer?: TPCB_LayersInTheSelectable | Array<TPCB_LayersInTheSelectable>, setOtherLayerVisible?: boolean): Promise<boolean>;` — 将层设置为不可见
- `lockLayer(layer?: TPCB_LayersInTheSelectable | Array<TPCB_LayersInTheSelectable>): Promise<boolean>;` — 锁定层
- `unlockLayer(layer?: TPCB_LayersInTheSelectable | Array<TPCB_LayersInTheSelectable>): Promise<boolean>;` — 取消锁定层
- `setTheNumberOfCopperLayers(numberOfLayers: 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 | 28 | 30 | 32): Promise<boolean>;` — 设置铜箔层数
- `getTheNumberOfCopperLayers(): Promise<number>;` — 获取铜箔层数
- `setLayerColorConfiguration(colorConfiguration: EPCB_LayerColorConfiguration): Promise<boolean>;` — 设置层颜色配置
- `setInactiveLayerTransparency(transparency: number): Promise<boolean>;` — 设置非激活层透明度
- `setPcbType(pcbType: EPCB_PcbPlateType): Promise<boolean>;` — 1. 嘉立创暂不支持超过 2 层铜箔层的 FPC 软板生产；
- `addCustomLayer(): Promise<TPCB_LayersOfCustom | undefined>;` — 新增自定义层
- `removeLayer(layer: TPCB_LayersOfCustom): Promise<boolean>;` — 移除层
- `modifyLayer(layer: TPCB_LayersInTheSelectable, property: {` — 修改图层属性
- `getAllLayers(): Promise<Array<IPCB_LayerItem>>;` — 获取所有图层的详细属性
- `setInactiveLayerDisplayMode(displayMode?: EPCB_InactiveLayerDisplayMode): Promise<boolean>;` — 设置非激活层展示模式
- `getCurrentPhysicalStackingConfigurationName(): Promise<string | undefined>;` — 获取当前物理叠层配置名称
- `getCurrentPhysicalStackingConfiguration(): {` — 获取当前物理叠层配置
- `getPhysicalStackingConfiguration(configurationName: string): Promise<{` — 获取指定物理叠层配置
- `getAllPhysicalStackingConfigurations(): Promise<Array<{` — 获取所有物理叠层配置
- `savePhysicalStackingConfiguration(physicalStackingConfiguration: {` — 保存物理叠层配置
- `renamePhysicalStackingConfiguration(originalConfigurationName: string, configurationName: string): Promise<boolean>;` — 重命名物理叠层配置
- `deletePhysicalStackingConfiguration(configurationName: string): Promise<boolean>;` — 删除物理叠层配置
- `getDefaultPhysicalStackingConfigurationName(): Promise<string | undefined>;` — 获取新建 PCB 默认物理叠层配置的名称
- `setAsDefaultPhysicalStackingConfiguration(configurationName: string): Promise<boolean>;` — 设置为新建 PCB 默认物理叠层配置
- `overwriteCurrentPhysicalStackingConfiguration(physicalStackingConfiguration: {` — 覆写当前物理叠层配置

## PCB_ManufactureData

调用：`eda.pcb_ManufactureData.xxx()`

- `getGerberFile(fileName?: string, colorSilkscreen?: boolean, unit?: ESYS_Unit.MILLIMETER | ESYS_Unit.INCH, digitalFormat?: {` — );
- `get3DFile(fileName?: string, fileType?: 'step' | 'obj', element?: Array<'Component Model' | 'Via' | 'Silkscreen' | 'Wire In Signal Layer'>, modelMode?: 'Outfit' | 'Parts', autoGenerateModels?: boolean` — );
- `get3DShellFile(fileName?: string, fileType?: 'stl' | 'step' | 'obj'): Promise<File | undefined>;` — }
- `getPickAndPlaceFile(fileName?: string, fileType?: 'xlsx' | 'csv', unit?: ESYS_Unit.MILLIMETER | ESYS_Unit.MIL): Promise<File | undefined>;` — }
- `getFlyingProbeTestFile(fileName?: string): Promise<File | undefined>;` — }
- `getBomTemplates(): Promise<Array<string>>;` — });
- `uploadBomTemplateFile(templateFile: File, template?: string): Promise<string | undefined>;` — }
- `getBomTemplateFile(template: string): Promise<File | undefined>;` — }
- `deleteBomTemplate(template: string): Promise<boolean>;` — }
- `getBomFile(fileName?: string, fileType?: 'xlsx' | 'csv', template?: string, filterOptions?: Array<{` — );
- `getTestPointFile(fileName?: string, fileType?: 'xlsx' | 'csv'): Promise<File | undefined>;` — }
- `getNetlistFile(fileName?: string, netlistType?: ESYS_NetlistType): Promise<File | undefined>;` — );
- `getDxfFile(fileName?: string, layers?: Array<{` — 获取 DXF 文件
- `getPdfFile(fileName?: string, outputMethod?: EPCB_PdfOutputMethod, contentConfig?: {` — }
- `getIpcD356AFile(fileName?: string): Promise<File | undefined>;` — }
- `getIpc2581CFile(fileName?: string, fileType?: 'xml' | 'cvg' | '2581', unit?: ESYS_Unit.INCH | ESYS_Unit.MILLIMETER, oemNumber?: 'Device' | 'Manufacturer Part' | 'Supplier Part' | 'Comment'): Promise<F` — 获取 IPC-2581C 文件
- `getOpenDatabaseDoublePlusFile(fileName?: string, unit?: ESYS_Unit.INCH, otherData?: {` — }
- `getInteractiveBomFile(fileName?: string): Promise<File | undefined>;` — 获取交互式 BOM 文件
- `getDsnFile(fileName?: string): Promise<File | undefined>;` — }
- `getAutoRouteJsonFile(fileName?: string): Promise<File | undefined>;` — }
- `getAutoRouteJsonFileForJRouter(fileName?: string): Promise<File | undefined>;` — 获取 JRouter 专用自动布线文件（JSON）
- `getAutoLayoutJsonFile(fileName?: string): Promise<File | undefined>;` — }
- `getAltiumDesignerFile(fileName?: string): Promise<File | undefined>;` — }
- `getPadsFile(fileName?: string): Promise<File | undefined>;` — }
- `getPcbInfoFile(fileName?: string): Promise<File | undefined>;` — }
- `getIdxFile(fileName?: string): Promise<File | undefined>;` — }
- `placeComponentsOrder(interactive?: boolean, ignoreWarning?: boolean): Promise<boolean>;` — 如果设置为 `false`，存在任意警告将中断执行并返回 `false` 的结果
- `placeSmtComponentsOrder(interactive?: boolean, ignoreWarning?: boolean): Promise<boolean>;` — 如果设置为 `false`，存在任意警告将中断执行并返回 `false` 的结果
- `placePcbOrder(interactive?: boolean, ignoreWarning?: boolean): Promise<boolean>;` — 如果设置为 `false`，存在任意警告将中断执行并返回 `false` 的结果
- `place3DShellOrder(interactive?: boolean, ignoreWarning?: boolean): Promise<boolean>;` — 如果设置为 `false`，存在任意警告将中断执行并返回 `false` 的结果
- `getManufactureData(): Promise<File | undefined>;` — 注意：本接口仅私有化部署版本有效，如若在其他版本调用将始终 `throw Error`

## PCB_MathPolygon

调用：`eda.pcb_MathPolygon.xxx()`

- `createPolygon(polygon: TPCB_PolygonSourceArray): IPCB_Polygon | undefined;` — 创建单多边形
- `createComplexPolygon(complexPolygon: TPCB_PolygonSourceArray | Array<TPCB_PolygonSourceArray> | IPCB_Polygon | Array<IPCB_Polygon>): IPCB_ComplexPolygon | undefined;` — 创建复杂多边形
- `splitPolygon(...complexPolygons: Array<IPCB_ComplexPolygon>): Array<IPCB_Polygon>;` — 拆分单多边形
- `discretize(polygon: IPCB_Polygon | TPCB_PolygonSourceArray, options?: IPCB_DiscretizeOptions): Array<IPCB_DiscretizedPoint>;` — 将单多边形离散化为点数据
- `calculateWidth(complexPolygon: TPCB_PolygonSourceArray | Array<TPCB_PolygonSourceArray> | IPCB_Polygon | IPCB_ComplexPolygon): number;` — 计算复杂多边形 BBox 宽度
- `calculateHeight(complexPolygon: TPCB_PolygonSourceArray | Array<TPCB_PolygonSourceArray> | IPCB_Polygon | IPCB_ComplexPolygon): number;` — 计算复杂多边形 BBox 高度
- `calculateBBoxHeight(complexPolygon: TPCB_PolygonSourceArray | Array<TPCB_PolygonSourceArray>): number;`
- `convertImageToComplexPolygon(imageBlob: Blob, imageWidth: number, imageHeight: number, tolerance?: number, simplification?: number, smoothing?: number, despeckling?: number, whiteAsBackgroundColor?: b` — 将图像转换为复杂多边形对象

## PCB_Net

调用：`eda.pcb_Net.xxx()`

- `getAllNets(): Promise<Array<IPCB_NetInfo>>;` — 获取所有网络的详细信息
- `getNet(net: string): Promise<IPCB_NetInfo | undefined>;` — 获取指定网络的详细信息
- `getAllNetsName(): Promise<Array<string>>;` — 获取所有网络的网络名称
- `getAllNetName(): Promise<Array<string>>;` — 获取所有网络的网络名称
- `getNetLength(net: string): Promise<number | undefined>;` — 获取指定网络的长度
- `getNetColor(net: string): Promise<IPCB_NetInfo['color'] | undefined>;` — 获取指定网络的颜色
- `setNetColor(net: string, color: IPCB_NetInfo['color']): Promise<boolean>;` — 设置指定网络的颜色
- `getAllPrimitivesByNet(net: string, primitiveTypes?: Array<EPCB_PrimitiveType>): Promise<Array<IPCB_Primitive>>;` — 获取关联指定网络的所有图元
- `selectNet(net: string): Promise<boolean>;` — 选中网络
- `unselectNet(net: string): Promise<boolean>;` — 取消选中网络
- `unselectAllNets(): Promise<boolean>;` — 取消选中所有网络
- `highlightNet(net: string): Promise<boolean>;` — 高亮网络
- `unhighlightNet(net: string): Promise<boolean>;` — 取消高亮网络
- `unhighlightAllNets(): Promise<boolean>;` — 取消高亮所有网络
- `getNetlist(type?: ESYS_NetlistType): Promise<string>;` — 获取网表
- `setNetlist(type: ESYS_NetlistType | undefined, netlist: string): Promise<boolean>;` — 更新网表

## PCB_Primitive

调用：`eda.pcb_Primitive.xxx()`

- `getPrimitiveTypeByPrimitiveId(id: string): Promise<EPCB_PrimitiveType | undefined>;` — 获取指定 ID 的图元的图元类型
- `getPrimitiveByPrimitiveId(id: string): Promise<IPCB_Primitive | undefined>;` — 获取指定 ID 的图元的所有属性
- `getPrimitivesByPrimitiveId(ids: Array<string>): Promise<Array<IPCB_Primitive>>;` — 获取指定所有 ID 的图元的所有属性
- `getPrimitivesBBox(primitiveIds: Array<string | IPCB_Primitive>): Promise<{` — 获取图元的 BBox
- `getPrimitiveBoardLine(primitiveId: string, layers?: Array<EPCB_LayerId>): IPCB_ComplexPolygon | undefined;` — 获取图元的边框线

## PCB_RayTracerEngine

调用：`eda.pcb_RayTracerEngine.xxx()`

- `init(): Promise<void>;` — 初始化光线追踪引擎
- `dispose(): Promise<void>;` — 停止光线追踪引擎
- `setRenderConfigurations(configurations: any): Promise<void>;` — ADD since EDA v4
- `getRenderConfigurations(): Promise<any>;` — ADD since EDA v4
- `getLightConfigurations(lightName: string): Promise<any>;` — ADD since EDA v4

## PCB_SelectControl

调用：`eda.pcb_SelectControl.xxx()`

- `getAllSelectedPrimitives_PrimitiveId(): Promise<Array<string>>;` — 查询所有已选中图元的图元 ID
- `getAllSelectedPrimitives(): Promise<Array<IPCB_Primitive>>;` — 查询所有已选中图元的图元对象
- `getSelectedPrimitives(): Promise<Array<Object>>;` — 查询选中图元的所有参数
- `doSelectPrimitives(primitiveIds: string | Array<string>): Promise<boolean>;` — 使用图元 ID 选中图元
- `doCrossProbeSelect(components?: Array<string>, pins?: Array<string>, nets?: Array<string>, highlight?: boolean, select?: boolean): Promise<boolean>;` — 进行交叉选择
- `doCrossProbeSelectByObject(components?: Array<string>, pins?: Array<string>, nets?: Array<string>): Promise<boolean>;` — 进行交叉选择
- `clearSelected(): Promise<boolean>;` — 清除选中
- `getCurrentMousePosition(): Promise<{` — 获取当前鼠标在画布上的位置
