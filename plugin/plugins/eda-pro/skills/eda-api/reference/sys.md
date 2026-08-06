# SYS_* — 系统（对话框、文件、存储、WebSocket、消息、窗口）

## SYS_ClientUrl

调用：`eda.sys_ClientUrl.xxx()`

- `request(url: string, method?: 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'PATCH', data?: string | Blob | FormData | URLSearchParams, options?: {` — 注意：本接口需要使用者启用扩展的外部交互权限，如若未启用将始终 `throw Error`

## SYS_Dialog

调用：`eda.sys_Dialog.xxx()`

- `createReactComponentizationDialogInterface(React: ISYS_ReactComponentizationDialogReactInstance, Reconciler: ISYS_ReactComponentizationDialogReconcilerInstance): Promise<ISYS_ReactComponentizationDial` — 创建 React 组件化弹出窗口接口
- `showInformationMessage(content: string, title?: string, buttonTitle?: string): void;` — 弹出消息窗口
- `showConfirmationMessage(content: string, title?: string, mainButtonTitle?: string, buttonTitle?: string, callbackFn?: (mainButtonClicked: boolean) => void): void;` — 弹出确认窗口
- `showInputDialog(beforeContent?: string, afterContent?: string, title?: string, type?: 'color' | 'date' | 'datetime-local' | 'email' | 'mouth' | 'number' | 'password' | 'tel' | 'text' | 'time' | 'url' ` — 弹出输入窗口
- `showSelectDialog(options: Array<string> | Array<{` — 如若为对象数组，则 `value` 表示选项的值，`displayContent` 表示选项的展示内容
- `showSelectDialog(options: Array<string> | Array<{` — 如若为对象数组，则 `value` 表示选项的值，`displayContent` 表示选项的展示内容
- `insertScriptToDialog(dialogId: string, scriptFunction: (...args: Array<any>) => void | Promise<void>, ...args: Array<any>): void;` — 向指定原生弹窗注入函数

## SYS_Environment

调用：`eda.sys_Environment.xxx()`

- `isWeb(): boolean;` — 是否处于浏览器环境
- `isClient(): boolean;` — 是否处于客户端环境
- `isEasyEDAProEdition(): boolean;` — 是否为 EasyEDA Pro 版本
- `isJLCEDAProEdition(): boolean;` — 是否为 嘉立创EDA 专业版本
- `isProPrivateEdition(): boolean;` — 是否为私有化部署版本
- `isOnlineMode(): boolean;` — 是否为在线模式
- `isHalfOfflineMode(): boolean;` — 是否为半离线模式
- `isOfflineMode(): boolean;` — 是否为全离线模式
- `getEditorCurrentVersion(): string;` — 获取编辑器当前版本
- `getEditorCompliedDate(): string;` — 获取编辑器编译日期
- `getUserInfo(): {` — 获取用户信息
- `setKeepProjectHasOnlyOneBoard(status?: boolean): Promise<void>;` — 设置环境：保持工程仅拥有一个板子

## SYS_FileManager

调用：`eda.sys_FileManager.xxx()`

- `getProjectFile(fileName?: string, password?: string, fileType?: 'epro' | 'epro2'): Promise<File | undefined>;` — 注意：本接口需要启用 **工程管理 \> 下载工程** 权限，没有权限调用将始终 `throw Error`
- `getDocumentFile(fileName?: string, password?: string, fileType?: 'epro' | 'epro2'): Promise<File | undefined>;` — 注意：本接口需要启用 **工程设计图 \> 文件导出** 权限，没有权限调用将始终 `throw Error`
- `getDocumentSource(): Promise<string | undefined>;` — 获取文档源码
- `getDocumentFootprintSources(): Promise<Array<{` — 获取文档封装源码
- `setDocumentSource(source: string): Promise<boolean>;` — 修改文档源码
- `getProjectFileByProjectUuid(projectUuid: string, fileName?: string, password?: string, fileType?: 'epro' | 'epro2'): Promise<File | undefined>;` — 注意：本接口需要启用 **工程管理 \> 下载工程** 权限，没有权限调用将始终 `throw Error`
- `getDeviceFileByDeviceUuid(deviceUuid: string | Array<string>, libraryUuid?: string, fileType?: 'elibz' | 'elibz2'): Promise<File | undefined>;` — 注意：本接口需要启用 **团队库 \> 下载库** 权限，没有权限调用将始终 `throw Error`
- `getSymbolFileBySymbolUuid(symbolUuid: string | Array<string>, libraryUuid?: string, fileType?: 'elibz' | 'elibz2'): Promise<File | undefined>;` — 注意：本接口需要启用 **团队库 \> 下载库** 权限，没有权限调用将始终 `throw Error`
- `getFootprintFileByFootprintUuid(footprintUuid: string | Array<string>, libraryUuid?: string, fileType?: 'elibz' | 'elibz2'): Promise<File | undefined>;` — 注意：本接口需要启用 **团队库 \> 下载库** 权限，没有权限调用将始终 `throw Error`
- `getCbbFileByCbbUuid(cbbUuid: string, libraryUuid?: string, props?: {` — 注意：本接口需要启用 **团队模块 \> 下载模块** 权限，没有权限调用将始终 `throw Error`
- `getPanelLibraryFileByPanelLibraryUuid(panelLibraryUuid: string | Array<string>, libraryUuid?: string, fileType?: 'elibz' | 'elibz2'): Promise<File | undefined>;` — 注意：本接口需要启用 **团队库 \> 下载库** 权限，没有权限调用将始终 `throw Error`
- `importProjectByProjectFile(projectFile: File, fileType?: 'JLCEDA' | 'JLCEDA Pro' | 'EasyEDA' | 'EasyEDA Pro' | 'Allegro' | 'OrCAD' | 'EAGLE' | 'KiCad' | 'PADS' | 'LTspice', props?: {` — 使用工程文件导入工程
- `importProjectByProjectFile(projectFile: File, fileType?: 'Altium Designer' | 'Protel', props?: {` — 使用工程文件导入工程
- `extractProjectInfo(data: File): Promise<any>;` — 提取文件内的工程配置信息
- `extractLibInfo(data: File | Array<File>): Promise<any>;` — 提取文件内的库配置信息

## SYS_FileSystem

调用：`eda.sys_FileSystem.xxx()`

- `getExtensionFile(uri: string): Promise<File | undefined>;` — 获取扩展内的文件
- `openReadFileDialog(filenameExtensions?: string | Array<string>, multiFiles?: true): Promise<Array<File> | undefined>;` — 打开读入文件窗口
- `openReadFileDialog(filenameExtensions?: string | Array<string>, multiFiles?: false): Promise<File | undefined>;` — 打开读入文件窗口
- `openReadFolderDialog(): Promise<Array<{` — 打开读入文件夹窗口
- `saveFile(fileData: File | Blob, fileName?: string): Promise<void>;` — 保存文件
- `readFileFromFileSystem(uri: string): Promise<File | undefined>;` — 注意 2：本接口需要使用者启用扩展的外部交互权限，如若未启用将始终 `throw Error`
- `saveFileToFileSystem(uri: string, fileData: File | Blob, fileName?: string, force?: boolean): Promise<boolean>;` — 如若结尾非斜杠，则识别为完整文件名，此时 `fileName` 参数将被忽略
- `listFilesOfFileSystem(folderPath: string, recursive?: boolean): Promise<Array<ISYS_FileSystemFileList>>;` — 注意 2：本接口需要使用者启用扩展的外部交互权限，如若未启用将始终 `throw Error`
- `deleteFileInFileSystem(uri: string, force?: boolean): Promise<boolean>;` — 如若结尾非斜杠，则识别为完整文件名，此时 `fileName` 参数将被忽略
- `createDirectoryInFileSystem(folderPath: string): Promise<boolean>;` — ADD since EDA v3.2.166
- `existsPathInFileSystem(uri: string): Promise<boolean>;` — ADD since EDA v3.2.167
- `getEdaPath(): Promise<string>;` — 注意 2：本接口需要使用者启用扩展的外部交互权限，如若未启用将始终 `throw Error`
- `getDocumentsPath(): Promise<string>;` — 注意 2：本接口需要使用者启用扩展的外部交互权限，如若未启用将始终 `throw Error`
- `getLibrariesPaths(): Promise<Array<string>>;` — 注意 2：本接口需要使用者启用扩展的外部交互权限，如若未启用将始终 `throw Error`
- `getProjectsPaths(): Promise<Array<string>>;` — 注意 2：本接口需要使用者启用扩展的外部交互权限，如若未启用将始终 `throw Error`
- `createObjectURL(blob: Blob | File): string;` — ADD since EDA v3.2.162
- `revokeObjectURL(url: string): void;` — ADD since EDA v3.2.162

## SYS_FontManager

调用：`eda.sys_FontManager.xxx()`

- `getFontsList(): Promise<Array<string>>;` — 获取当前已经配置的字体列表
- `addFont(fontName: string): Promise<boolean>;` — 添加字体到字体列表
- `deleteFont(fontName: string): Promise<boolean>;` — 删除字体列表内的指定字体

## SYS_FormatConversion

调用：`eda.sys_FormatConversion.xxx()`

- `convertAltiumDesignerLibrariesToEasyEDASingleFile(file: File | Array<File>): Promise<File | undefined>;` — 转换 Altium Designer 库到单个嘉立创库文件
- `convertAltiumDesignerLibrariesToEasyEDAMultiFiles(file: File | Array<File>): Promise<Array<File>>;` — 转换 Altium Designer 库到多个嘉立创库文件（每个器件一个文件）
- `convertDisaLibrariesToEasyEDASingleFile(file: File | Array<File>): Promise<File | undefined>;` — 转换 T/DISA 4001 库到单个嘉立创库文件
- `convertDisaLibrariesToEasyEDAMultiFiles(file: File | Array<File>): Promise<Array<File>>;` — 转换 T/DISA 4001 库到多个嘉立创库文件（每个器件一个文件）

## SYS_HeaderMenu

调用：`eda.sys_HeaderMenu.xxx()`

- `insertHeaderMenus(headerMenus: ISYS_HeaderMenus): Promise<void>;` — 导入顶部菜单数据
- `removeHeaderMenus(): void;` — 移除顶部菜单数据
- `replaceHeaderMenus(headerMenus: ISYS_HeaderMenus): Promise<void>;` — 替换顶部菜单数据
- `removeSystemHeaderMenuItem(id: Array<string>, props?: {` — 非公开接口使用提醒：本接口按原样提供，不提供参数的额外文档，参数可能在任何版本出现破坏性更改并不另行通知
- `insertSystemHeaderMenuItem(env: ESYS_HeaderMenuEnvironment, id: Array<string>, props: {` — 非公开接口使用提醒：本接口按原样提供，不提供参数的额外文档，参数可能在任何版本出现破坏性更改并不另行通知
- `insertSystemHeaderMenus(headerMenus: ISYS_HeaderMenus): void;` — };

## SYS_I18n

调用：`eda.sys_I18n.xxx()`

- `text(tag: string, namespace?: string, language?: string, ...args: Array<any>): string;` — 可以使用 `${1}` 格式的占位符表示参数；
- `getCurrentLanguage(): Promise<string>;` — 获取当前语言环境
- `getAllSupportedLanguages(): Array<string>;` — 查询所有支持的语言
- `isLanguageSupported(language: string): boolean;` — 检查语言是否受支持
- `importMultilingual(language: string, source: ISYS_LanguageKeyValuePairs): boolean;` — 导入多语言
- `importMultilingualLanguage(namespace: string, language: string, source: ISYS_LanguageKeyValuePairs): boolean;` — 导入多语言：指定命名空间和语言
- `importMultilingualNamespace(namespace: string, source: ISYS_MultilingualLanguagesData): boolean;` — 导入多语言：指定命名空间
- `addLanguageChangedEventListener(id: string, callFn: (newLanguage: string, lastLanguage: string) => void | Promise<void>, onlyOnce: boolean): void;` — 新增语言切换事件监听
- `removeEventListener(id: string): boolean;` — 移除事件监听
- `isEventListenerAlreadyExist(id: string): boolean;` — 查询事件监听是否存在

## SYS_IFrame

调用：`eda.sys_IFrame.xxx()`

- `openIFrame(htmlFileName: string, width?: number, height?: number, id?: string, props?: {` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `closeIFrame(id?: string): Promise<boolean>;` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `hideIFrame(id?: string): Promise<boolean>;` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `showIFrame(id?: string): Promise<boolean>;` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `isIFrameAlreadyExist(id: string): Promise<boolean>;` — 内联框架是否已存在

## SYS_LoadingAndProgressBar

调用：`eda.sys_LoadingAndProgressBar.xxx()`

- `showProgressBar(progress?: number, title?: string): void;` — 显示进度条或设置进度条进度
- `destroyProgressBar(): void;` — 销毁进度条
- `showLoading(): void;` — 显示无进度加载覆盖
- `destroyLoading(): void;` — 销毁无进度加载覆盖

## SYS_Log

调用：`eda.sys_Log.xxx()`

- `add(message: string, type?: ESYS_LogType): void;` — 添加日志条目
- `clear(): void;` — 清空日志
- `export(types?: ESYS_LogType | Array<ESYS_LogType>): void;` — 导出日志
- `sort(types?: ESYS_LogType | Array<ESYS_LogType>): Promise<Array<ISYS_LogLine>>;` — 筛选并获取日志条目
- `find(message: string | Array<string | {` — 查找条目

## SYS_Math

调用：`eda.sys_Math.xxx()`

- `containsPoint(polygon: TSYS_MathPolygonInput, point: ISYS_MathPoint): boolean;` — 具体取决于射线方向与边界的几何关系
- `distanceToPoint(polygon: TSYS_MathPolygonInput, point: ISYS_MathPoint): number;` — 计算点到多边形边界的最短距离
- `intersects(polygon1: TSYS_MathPolygonInput, polygon2: TSYS_MathPolygonInput): boolean;` — 判断两个多边形是否相交
- `contains(polygon1: TSYS_MathPolygonInput, polygon2: TSYS_MathPolygonInput): boolean;` — 判断 polygon1 是否完全包含 polygon2
- `getBBox(polygon: TSYS_MathPolygonInput): ISYS_MathBBox;` — 获取多边形的最小外接矩形（BBox）
- `bboxIntersects(bbox1: ISYS_MathBBox, bbox2: ISYS_MathBBox): boolean;` — 快速判断两个 BBox 是否相交
- `calculateArea(polygon: TSYS_MathPolygonInput): number;` — 计算所有外环面积之和减去所有孔洞面积之和，得到净面积
- `calculatePerimeter(polygon: TSYS_MathPolygonInput): number;` — 计算多边形周长
- `getCentroid(polygon: TSYS_MathPolygonInput): ISYS_MathPoint;` — 计算多边形质心
- `translate(polygon: TSYS_MathPolygonInput, dx: number, dy: number): Array<ISYS_MathPoint>;` — 平移多边形
- `rotate(polygon: TSYS_MathPolygonInput, angle: number, centerX?: number, centerY?: number): Array<ISYS_MathPoint>;` — 旋转多边形
- `scale(polygon: TSYS_MathPolygonInput, scaleX: number, scaleY?: number, centerX?: number, centerY?: number): Array<ISYS_MathPoint>;` — 缩放多边形
- `union(polygon1: TSYS_MathPolygonInput, polygon2: TSYS_MathPolygonInput): TSYS_MathPolygonGroup;` — 计算两个多边形的并集
- `subtract(polygon1: TSYS_MathPolygonInput, polygon2: TSYS_MathPolygonInput): TSYS_MathPolygonGroup;` — 计算两个多边形的差集（polygon1 - polygon2）
- `intersection(polygon1: TSYS_MathPolygonInput, polygon2: TSYS_MathPolygonInput): TSYS_MathPolygonGroup;` — 计算两个多边形的交集
- `xor(polygon1: TSYS_MathPolygonInput, polygon2: TSYS_MathPolygonInput): TSYS_MathPolygonGroup;` — 计算两个多边形的对称差集（异或）

## SYS_Message

调用：`eda.sys_Message.xxx()`

- `showToastMessage(message: string, messageType?: ESYS_ToastMessageType, timer?: number, bottomPanel?: ESYS_BottomPanelTab, buttonTitle?: string, buttonCallbackFn?: string): void;` — 显示吐司消息
- `showFollowMouseTip(tip: string, msTimeout?: number): Promise<void>;` — 展示跟随鼠标的提示
- `removeFollowMouseTip(tip?: string): Promise<void>;` — 移除跟随鼠标的提示

## SYS_MessageBox

调用：`eda.sys_MessageBox.xxx()`

- `showInformationMessage(content: string, title?: string, buttonTitle?: string): void;` — 显示消息框
- `showConfirmationMessage(content: string, title?: string, mainButtonTitle?: string, buttonTitle?: string, callbackFn?: (mainButtonClicked: boolean) => void): void;` — 显示确认框

## SYS_MessageBus

调用：`eda.sys_MessageBus.xxx()`

- `createPrivateMessageBus(): void;` — 创建私有消息总线
- `removePrivateMessageBus(): void;` — 移除私有消息总线
- `push(topic: string, message: any): void;` — 私有消息总线：推消息
- `pushPublic(topic: string, message: any): void;` — 公共消息总线：推消息
- `pull(topic: string, callbackFn: (message: any) => void): ISYS_MessageBusTask;` — 私有消息总线：拉消息
- `pullPublic(topic: string, callbackFn: (message: any) => void): ISYS_MessageBusTask;` — 公共消息总线：拉消息
- `pullAsync(topic: string): Promise<any>;` — 私有消息总线：拉消息 Promise 版本
- `pullAsyncPublic(topic: string): Promise<any>;` — 公共消息总线：拉消息 Promise 版本
- `publish(topic: string, message: any): void;` — 私有消息总线：发布消息
- `publishPublic(topic: string, message: any): void;` — 公共消息总线：发布消息
- `subscribe(topic: string, callbackFn: (message: any) => void): ISYS_MessageBusTask;` — 私有消息总线：订阅消息
- `subscribePublic(topic: string, callbackFn: (message: any) => void): ISYS_MessageBusTask;` — 公共消息总线：订阅消息
- `subscribeOnce(topic: string, callbackFn: (message: any) => void): ISYS_MessageBusTask;` — 私有消息总线：订阅单次消息
- `subscribeOncePublic(topic: string, callbackFn: (message: any) => void): ISYS_MessageBusTask;` — 公共消息总线：订阅单次消息
- `rpcCall(topic: string, message?: any, timeout?: number): Promise<any>;` — 私有消息总线：调用 RPC 服务
- `rpcCallPublic(topic: string, message?: any, timeout?: number): Promise<any>;` — 公共消息总线：调用 RPC 服务
- `rpcService(topic: string, callbackFn: (...args: Array<any>) => any | Promise<any>): void;` — 私有消息总线：注册 RPC 服务
- `rpcServicePublic(topic: string, callbackFn: (...args: Array<any>) => any | Promise<any>): void;` — 公共消息总线：注册 RPC 服务

## SYS_PanelControl

调用：`eda.sys_PanelControl.xxx()`

- `openLeftPanel(tab?: ESYS_LeftPanelTab): void;` — 打开左侧面板
- `closeLeftPanel(): void;` — 关闭左侧面板
- `toggleLeftPanelLockState(state?: boolean): void;` — 切换左侧面板锁定状态
- `isLeftPanelLocked(): Promise<boolean>;` — 查询左侧面板是否已锁定
- `openRightPanel(tab?: ESYS_RightPanelTab): void;` — 打开右侧面板
- `closeRightPanel(): void;` — 关闭右侧面板
- `toggleRightPanelLockState(state?: boolean): void;` — 切换右侧面板锁定状态
- `isRightPanelLocked(): Promise<boolean>;` — 查询右侧面板是否已锁定
- `openBottomPanel(tab?: ESYS_BottomPanelTab): void;` — 打开底部面板
- `closeBottomPanel(): void;` — 关闭底部面板
- `toggleBottomPanelLockState(state?: boolean): void;` — 切换底部面板锁定状态
- `isBottomPanelLocked(): Promise<boolean>;` — 查询底部面板是否已锁定

## SYS_RightClickMenu

调用：`eda.sys_RightClickMenu.xxx()`

- `changeMenu(menuId: string, menuItems: Array<ISYS_RightClickMenuItem | null>): Promise<void>;` — 非公开接口使用提醒：本接口按原样提供，不提供参数的额外文档，参数可能在任何版本出现破坏性更改并不另行通知

## SYS_Setting

调用：`eda.sys_Setting.xxx()`

- `restoreDefault(): Promise<boolean>;` — 全局恢复默认设置

## SYS_ShortcutKey

调用：`eda.sys_ShortcutKey.xxx()`

- `registerShortcutKey(shortcutKey: TSYS_ShortcutKeys, title: string, callbackFn: (shortcutKey: TSYS_ShortcutKeys) => void | Promise<void>, documentType?: Array<ESYS_ShortcutKeyEffectiveEditorDocumentTyp` — 注册快捷键
- `unregisterShortcutKey(shortcutKey: TSYS_ShortcutKeys): Promise<boolean>;` — 反注册快捷键
- `getShortcutKeys(includeSystem?: boolean): Promise<Array<{` — 查询快捷键列表

## SYS_Storage

调用：`eda.sys_Storage.xxx()`

- `getExtensionAllUserConfigs(): {` — 获取扩展所有用户配置
- `setExtensionAllUserConfigs(configs: {` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `clearExtensionAllUserConfigs(): Promise<boolean>;` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `getExtensionUserConfig(key: string): any | undefined;` — 获取扩展用户配置
- `setExtensionUserConfig(key: string, value: any): Promise<boolean>;` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `deleteExtensionUserConfig(key: string): Promise<boolean>;` — 删除扩展用户配置

## SYS_Timer

调用：`eda.sys_Timer.xxx()`

- `setIntervalTimer(id: string, timeout: number, callFn: (...args: any) => void, ...args: any): boolean;` — 设置循环定时器
- `clearIntervalTimer(id: string): boolean;` — 清除指定循环定时器
- `setTimeoutTimer(id: string, timeout: number, callFn: (...args: any) => void, ...args: any): boolean;` — 设置单次定时器
- `clearTimeoutTimer(id: string): boolean;` — 清除指定单次定时器

## SYS_ToastMessage

调用：`eda.sys_ToastMessage.xxx()`

- `showMessage(message: string, messageType?: ESYS_ToastMessageType, timer?: number, bottomPanel?: ESYS_BottomPanelTab, buttonTitle?: string, buttonCallbackFn?: string): void;` — 显示吐司消息

## SYS_Tool

调用：`eda.sys_Tool.xxx()`

- `netlistComparison(netlist1: string | {` — 网表对比
- `schematicComparison(schematic1: string | {` — 原理图对比
- `pcbComparison(pcb1: string | {` — PCB 对比

## SYS_Unit

调用：`eda.sys_Unit.xxx()`

- `getFrontendDataUnit(): Promise<ESYS_Unit | undefined>;` — 获取 EDA 前端数据单位跨度
- `milToMm(mil: number, numberOfDecimals?: number): number;` — 单位转换：密尔到毫米
- `milToInch(mil: number, numberOfDecimals?: number): number;` — 单位转换：密尔到英寸
- `mmToMil(mm: number, numberOfDecimals?: number): number;` — 单位转换：毫米到密尔
- `mmToInch(mm: number, numberOfDecimals?: number): number;` — 单位转换：毫米到英寸
- `inchToMil(inch: number, numberOfDecimals?: number): number;` — 单位转换：英寸到密尔
- `inchToMm(inch: number, numberOfDecimals?: number): number;` — 单位转换：英寸到毫米

## SYS_WebSocket

调用：`eda.sys_WebSocket.xxx()`

- `register(id: string, serviceUri: string, receiveMessageCallFn?: (event: MessageEvent<any>) => void | Promise<void>, connectedCallFn?: () => void | Promise<void>, protocols?: string | Array<string>): v` — 注意：本接口需要使用者启用扩展的外部交互权限，如若未启用将始终 `throw Error`
- `send(id: string, data: string | Blob | BufferSource, extensionUuid?: string): void;` — 向 WebSocket 服务器发送数据
- `close(id: string, code?: number, reason?: string, extensionUuid?: string): void;` — 关闭 WebSocket 连接

## SYS_Window

调用：`eda.sys_Window.xxx()`

- `open(url: string, target?: ESYS_WindowOpenTarget): void;` — 打开资源窗口
- `addEventListener(type: ESYS_WindowEventType, listener: (ev: any) => any, options?: {` — 新增事件监听
- `removeEventListener(removableObject: ISYS_WindowEventListenerRemovableObject): void;` — 移除事件监听
- `openUI(uiName: string, args?: {` — 打开 UI 窗口
- `getCurrentTheme(): Promise<ESYS_Theme>;` — 获取当前主题
- `getUrlParam(key: string): string | null;` — 获取 URL 参数
- `getUrlAnchor(): string;` — 获取 URL 锚点
- `urlPushState(url: string): void;` — 追加新的 URL 历史记录栈信息
- `urlReplaceState(url: string): void;` — 修改当前的 URL 历史记录栈信息
- `getViewportSize(): {` — 获取页面当前视口大小
- `hideStartPageSupportFloatBarItems(): Promise<boolean>;` — ADD since EDA v3.2.162
- `hideStartPageQuickStartItems(items: Array<ESYS_StartPageQuickStartItem>): Promise<boolean>;` — ADD since EDA v3.2.162
