# SCH_* — 原理图（图元、DRC、事件、生产数据、仿真）

## SCH_Document

调用：`eda.sch_Document.xxx()`

- `importChanges(): Promise<boolean>;` — 从 PCB 导入变更
- `save(): Promise<boolean>;` — 保存文档
- `navigateToCoordinates(x: number, y: number): Promise<boolean>;` — 此处的单位跨度为 0.01inch
- `navigateToRegion(left: number, right: number, top: number, bottom: number): Promise<boolean>;` — 此处的单位跨度为 0.01inch
- `getPrimitiveAtPoint(x: number, y: number): ISCH_Primitive | undefined;` — 获取坐标点的图元
- `getPrimitivesInRegion(left: number, right: number, top: number, bottom: number): Array<ISCH_Primitive>;` — 获取区域内所有图元
- `getCurrentFilterConfiguration(): Promise<{` — 获取当前画布过滤器配置
- `autoRouting(props?: {` — 自动布线
- `autoLayout(props?: {` — 自动布局

## SCH_Drc

调用：`eda.sch_Drc.xxx()`

- `check(strict: boolean, userInterface: boolean, includeVerboseError: false): Promise<boolean>;` — 检查 DRC
- `check(strict: boolean, userInterface: boolean, includeVerboseError: true): Promise<Array<any>>;` — 检查 DRC

## SCH_Event

调用：`eda.sch_Event.xxx()`

- `addMouseEventListener(id: string, eventType: 'all' | ESCH_MouseEventType, callFn: (eventType: ESCH_MouseEventType) => void | Promise<void>, onlyOnce?: boolean): void;` — 新增鼠标事件监听
- `addPrimitiveEventListener(id: string, eventType: 'all' | ESCH_PrimitiveEventType, callFn: (eventType: ESCH_PrimitiveEventType, props: {` — 新增图元事件监听
- `addSimulationEnginePullEventListener(id: string, eventType: 'all', callFn: (eventType: ESCH_DynamicSimulationEnginePullEventType | ESCH_SpiceSimulationEnginePullEventType, props: {` — 注册仿真引擎拉取事件监听
- `removeEventListener(id: string): boolean;` — 移除事件监听
- `isEventListenerAlreadyExist(id: string): boolean;` — 查询事件监听是否存在

## SCH_ManufactureData

调用：`eda.sch_ManufactureData.xxx()`

- `getAssemblyVariantsConfigs(): Promise<Array<{` — 获取装配体变量配置列表
- `getBomTemplates(): Promise<Array<string>>;` — 获取 BOM 模板列表
- `uploadBomTemplateFile(templateFile: File, template?: string): Promise<string | undefined>;` — 上传 BOM 模板文件
- `getBomTemplateFile(template: string): Promise<File | undefined>;` — 获取 BOM 模板文件
- `deleteBomTemplate(template: string): Promise<boolean>;` — 删除 BOM 模板
- `getBomFile(fileName?: string, fileType?: 'xlsx' | 'csv', template?: string, filterOptions?: Array<{` — 获取 BOM 文件
- `getNetlistFile(fileName?: string, netlistType?: ESYS_NetlistType): Promise<File | undefined>;` — 获取网表文件（Netlist）
- `getSimulationNetlistFile(fileName?: string, netlistType?: ESCH_SimulationNetlistType): Promise<File | undefined>;` — 获取仿真网表文件
- `getExportDocumentFile(fileName?: string, fileType?: ESCH_ExportDocumentFileType, typeSpecificParams?: {` — 可以使用 {@link SYS_FileSystem.saveFile} 接口将文件导出到本地文件系统
- `placeComponentsOrder(interactive?: boolean, ignoreWarning?: boolean): Promise<boolean>;` — 如果设置为 `false`，存在任意警告将中断执行并返回 `false` 的结果
- `placeSmtComponentsOrder(interactive?: boolean, ignoreWarning?: boolean): Promise<boolean>;` — 如果设置为 `false`，存在任意警告将中断执行并返回 `false` 的结果

## SCH_Net

调用：`eda.sch_Net.xxx()`

- `getCurrentProjectAllNets(): Promise<Array<ISCH_ProjectNetInfo>>;` — 获取当前工程下所有网络的详细信息
- `getAllNets(): Promise<Array<ISCH_NetInfo>>;` — 获取所有网络的详细信息
- `getNet(net: string): Promise<ISCH_NetInfo | undefined>;` — 获取指定网络的详细信息
- `getAllNetsName(): Promise<Array<string>>;` — 获取所有网络的网络名称

## SCH_Netlist

调用：`eda.sch_Netlist.xxx()`

- `getNetlist(type?: ESYS_NetlistType): Promise<string>;` — 获取网表
- `setNetlist(type: ESYS_NetlistType | undefined, netlist: string): Promise<void>;` — 更新网表

## SCH_Primitive

调用：`eda.sch_Primitive.xxx()`

- `getPrimitiveTypeByPrimitiveId(id: string): Promise<ESCH_PrimitiveType | undefined>;` — 获取指定 ID 的图元的图元类型
- `getPrimitiveByPrimitiveId(id: string): Promise<ISCH_Primitive | undefined>;` — 获取指定 ID 的图元的所有属性
- `getPrimitivesByPrimitiveId(ids: Array<string>): Promise<Array<ISCH_Primitive>>;` — 获取指定所有 ID 的图元的所有属性
- `getPrimitivesBBox(primitiveIds: Array<string | ISCH_Primitive>): Promise<{` — 获取图元的 BBox

## SCH_SelectControl

调用：`eda.sch_SelectControl.xxx()`

- `getAllSelectedPrimitives_PrimitiveId(): Promise<Array<string>>;` — 查询所有已选中图元的图元 ID
- `getAllSelectedPrimitives(): Promise<Array<ISCH_Primitive>>;` — 查询所有已选中图元的图元对象
- `getSelectedPrimitives_PrimitiveId(): Promise<Array<string>>;` — 查询选中图元的图元 ID
- `getSelectedPrimitives(): Promise<Array<Object>>;` — 查询选中图元的所有参数
- `doSelectPrimitives(primitiveIds: string | Array<string>): Promise<boolean>;` — 使用图元 ID 选中图元
- `doCrossProbeSelect(components?: Array<string>, pins?: Array<string>, nets?: Array<string>, highlight?: boolean, select?: boolean): boolean;` — 进行交叉选择
- `clearSelected(): boolean;` — 清除选中
- `getCurrentMousePosition(): Promise<{` — 获取当前鼠标在画布上的位置

## SCH_SimulationEngine

调用：`eda.sch_SimulationEngine.xxx()`

- `pushData(eventType: ESCH_DynamicSimulationEnginePushEventType | ESCH_SpiceSimulationEnginePushEventType, props: {` — 向仿真内核发送数据

## SCH_Utils

调用：`eda.sch_Utils.xxx()`

- `splitLines(lines: Array<number | Array<number>>): Array<Array<number | Array<number>>> | undefined;` — 将相互之间无任何连接的多段线坐标组拆分成多个多段线，无论是否有多个多段线，本函数都会在输入数据的基础上包裹一层数组；
