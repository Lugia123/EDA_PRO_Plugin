# DMT_* — 文档树（工程、板子、原理图、PCB、团队、编辑器控制）

## DMT_Board

调用：`eda.dmt_Board.xxx()`

- `createBoard(schematicUuid?: string, pcbUuid?: string): Promise<string | undefined>;` — 创建板子
- `modifyBoardName(originalBoardName: string, boardName: string): Promise<boolean>;` — 修改板子名称
- `copyBoard(sourceBoardName: string): Promise<string | undefined>;` — 复制板子
- `getBoardInfo(boardName: string): Promise<IDMT_BoardItem | undefined>;` — 获取板子的详细属性
- `getAllBoardsInfo(): Promise<Array<IDMT_BoardItem>>;` — 获取工程内所有板子的详细属性
- `getCurrentBoardInfo(): Promise<IDMT_BoardItem | undefined>;` — 获取当前板子的详细属性
- `deleteBoard(boardName: string): Promise<boolean>;` — 删除板子

## DMT_EditorControl

调用：`eda.dmt_EditorControl.xxx()`

- `openDocument(documentUuid: string, splitScreenId?: string): Promise<string | undefined>;` — 打开文档
- `openLibraryDocument(libraryUuid: string, libraryType: ELIB_LibraryType.SYMBOL | ELIB_LibraryType.FOOTPRINT, uuid: string, splitScreenId?: string): Promise<string | undefined>;` — 打开库符号、封装文档
- `closeDocument(tabId: string): Promise<boolean>;` — 关闭文档
- `getSplitScreenTree(): Promise<IDMT_EditorSplitScreenItem | undefined>;` — 获取编辑器分屏属性树
- `getSplitScreenIdByTabId(tabId: string): Promise<string | undefined>;` — 使用标签页 ID 获取分屏 ID
- `getTabsBySplitScreenId(splitScreenId: string): Promise<Array<IDMT_EditorTabItem>>;` — 获取指定分屏 ID 下的所有标签页
- `createSplitScreen(splitScreenType: EDMT_EditorSplitScreenDirection, tabId: string): Promise<{` — 创建分屏
- `moveDocumentToSplitScreen(tabId: string, splitScreenId: string): Promise<boolean>;` — 将文档移动到指定分屏
- `activateDocument(tabId: string): Promise<boolean>;` — 激活文档
- `activateSplitScreen(splitScreenId: string): Promise<boolean>;` — 激活分屏
- `tileAllDocumentToSplitScreen(): Promise<boolean>;` — 平铺所有文档
- `mergeAllDocumentFromSplitScreen(): Promise<boolean>;` — 合并所有分屏
- `getCurrentRenderedAreaImage(tabId?: string): Promise<Blob | undefined>;` — 获取画布渲染区域图像
- `zoomToRegion(left: number, right: number, top: number, bottom: number, tabId?: string): Promise<boolean>;` — 缩放到区域
- `zoomTo(x?: number, y?: number, scaleRatio?: number, tabId?: string): Promise<{` — 缩放到坐标
- `zoomToAllPrimitives(tabId?: string): Promise<{` — 缩放到所有图元（适应全部）
- `zoomToSelectedPrimitives(tabId?: string): Promise<{` — 缩放到已选中图元（适应选中）
- `zoom(percent: number, tabId?: string): {` — 设置缩放比例
- `generateIndicatorMarkers(markers: Array<IDMT_IndicatorMarkerShape>, color?: {` — 生成指示标记
- `removeIndicatorMarkers(tabId?: string): Promise<boolean>;` — 移除指示标记

## DMT_Event

调用：`eda.dmt_Event.xxx()`

- `addEditorTabEventListener(id: string, eventType: 'all' | EDMT_EditorTabEventType, callFn: (eventType: EDMT_EditorTabEventType, props: {` — 注意：本接口仅扩展有效，在独立脚本环境内调用将始终 `throw Error`
- `removeEventListener(id: string): boolean;` — 移除事件监听
- `isEventListenerAlreadyExist(id: string): boolean;` — 查询事件监听是否存在

## DMT_Folder

调用：`eda.dmt_Folder.xxx()`

- `createFolder(folderName: string, teamUuid: string, parentFolderUuid?: string, description?: string): Promise<string | undefined>;` — 创建文件夹
- `modifyFolderName(teamUuid: string, folderUuid: string, folderName: string): Promise<boolean>;` — 修改文件夹名称
- `modifyFolderDescription(teamUuid: string, folderUuid: string, description?: string): Promise<boolean>;` — 修改文件夹描述
- `moveFolderToFolder(teamUuid: string, folderUuid: string, parentFolderUuid?: string): Promise<boolean>;` — 移动文件夹
- `getAllFoldersUuid(teamUuid: string): Promise<Array<string>>;` — 获取所有文件夹的 UUID
- `getFolderInfo(teamUuid: string, folderUuid: string): Promise<IDMT_FolderItem | undefined>;` — 获取文件夹详细属性
- `deleteFolder(teamUuid: string, folderUuid: string): Promise<boolean>;` — 删除文件夹

## DMT_Panel

调用：`eda.dmt_Panel.xxx()`

- `createPanel(): Promise<string | undefined>;` — 创建面板
- `modifyPanelName(panelUuid: string, panelName: string): Promise<boolean>;` — 修改面板名称
- `copyPanel(panelUuid: string): Promise<string | undefined>;` — 复制面板
- `getPanelInfo(panelUuid: string): Promise<IDMT_PanelItem | undefined>;` — 获取面板的详细属性
- `getAllPanelsInfo(): Promise<Array<IDMT_PanelItem>>;` — 获取工程内所有面板的详细属性
- `getCurrentPanelInfo(): Promise<IDMT_PanelItem | undefined>;` — 获取当前面板的详细属性
- `deletePanel(panelUuid: string): Promise<boolean>;` — 删除面板

## DMT_Pcb

调用：`eda.dmt_Pcb.xxx()`

- `createPcb(boardName?: string): Promise<string | undefined>;` — 创建 PCB
- `modifyPcbName(pcbUuid: string, pcbName: string): Promise<boolean>;` — 修改 PCB 名称
- `copyPcb(pcbUuid: string, boardName?: string): Promise<string | undefined>;` — 复制 PCB
- `getPcbInfo(pcbUuid: string): Promise<IDMT_PcbItem | undefined>;` — 获取 PCB 的详细属性
- `getAllPcbsInfo(): Promise<Array<IDMT_PcbItem>>;` — 获取工程内所有 PCB 的详细属性
- `getCurrentPcbInfo(): Promise<IDMT_PcbItem | undefined>;` — 获取当前 PCB 的详细属性
- `deletePcb(pcbUuid: string): Promise<boolean>;` — 删除 PCB

## DMT_Project

调用：`eda.dmt_Project.xxx()`

- `openProject(projectUuid: string): Promise<boolean>;` — 打开工程
- `createProject(projectFriendlyName: string, projectName?: string, teamUuid?: string, folderUuid?: string, description?: string, collaborationMode?: EDMT_ProjectCollaborationMode): Promise<string | unde` — 创建工程
- `modifyProjectFriendlyName(projectUuid: string, projectFriendlyName: string): boolean;` — 修改工程友好名称
- `modifyProjectDescription(projectUuid: string, description?: string): boolean;` — 修改工程描述
- `modifyProjectCollaborationMode(projectUuid: string, collaborationMode: EDMT_ProjectCollaborationMode): boolean;` — 修改工程协作模式
- `moveProject(projectUuid: string, teamUuid: string, folderUuid?: string): boolean;` — 移动工程
- `moveProjectToFolder(projectUuid: string, folderUuid?: string): Promise<boolean>;` — 移动工程到文件夹
- `copyProject(sourceProjectUuid: string, targetTeamUuid?: string, targetFolderUuid?: string, newProjectFriendlyName?: string, newProjectName?: string): string | undefined;` — 复制工程
- `getAllProjectsUuid(teamUuid?: string, folderUuid?: string, workspaceUuid?: string): Promise<Array<string>>;` — 如若指定 `workspaceUuid`，则在指定 Workspace 下获取指定团队/文件夹下的所有工程
- `getProjectInfo(projectUuid: string): Promise<IDMT_BriefProjectItem | undefined>;` — 获取工程属性
- `getCurrentProjectInfo(): Promise<IDMT_ProjectItem | undefined>;` — 获取当前工程的详细属性
- `deleteProject(projectUuid: string): boolean;` — 删除工程

## DMT_Schematic

调用：`eda.dmt_Schematic.xxx()`

- `createSchematic(boardName?: string): Promise<string | undefined>;` — 创建原理图
- `createSchematicPage(schematicUuid: string): Promise<string | undefined>;` — 创建原理图图页
- `modifySchematicName(schematicUuid: string, schematicName: string): Promise<boolean>;` — 修改原理图名称
- `modifySchematicPageName(schematicPageUuid: string, schematicPageName: string): Promise<boolean>;` — 修改原理图图页名称
- `modifySchematicPageTitleBlock(showTitleBlock?: boolean, titleBlockData?: {` — 修改原理图图页明细表
- `copySchematic(schematicUuid: string, boardName?: string): Promise<string | undefined>;` — 复制原理图
- `copySchematicPage(schematicPageUuid: string, schematicUuid?: string): Promise<string | undefined>;` — 复制原理图图页
- `getSchematicInfo(schematicUuid: string): Promise<IDMT_SchematicItem | undefined>;` — 获取原理图的详细属性
- `getSchematicPageInfo(schematicPageUuid: string): Promise<IDMT_SchematicPageItem | undefined>;` — 获取原理图图页的详细属性
- `getAllSchematicsInfo(): Promise<Array<IDMT_SchematicItem>>;` — 获取工程内所有原理图的详细属性
- `getAllSchematicPagesInfo(): Promise<Array<IDMT_SchematicPageItem>>;` — 获取工程内所有原理图图页的详细属性
- `getCurrentSchematicAllSchematicPagesInfo(): Promise<Array<IDMT_SchematicPageItem>>;` — 获取当前原理图内所有原理图图页的详细属性
- `getCurrentSchematicInfo(): Promise<IDMT_SchematicItem | undefined>;` — 获取当前原理图的详细属性
- `getCurrentSchematicPageInfo(): Promise<IDMT_SchematicPageItem | undefined>;` — 获取当前原理图图页的详细属性
- `reorderSchematicPages(schematicUuid: string, schematicPageItemsArray: Array<IDMT_SchematicPageItem>): Promise<boolean>;` — 重新排序原理图图页
- `deleteSchematic(schematicUuid: string): Promise<boolean>;` — 删除原理图
- `deleteSchematicPage(schematicPageUuid: string): Promise<boolean>;` — 删除原理图图页

## DMT_SelectControl

调用：`eda.dmt_SelectControl.xxx()`

- `getCurrentDocumentInfo(): Promise<IDMT_EditorDocumentItem | undefined>;` — 获取当前文档的属性

## DMT_Team

调用：`eda.dmt_Team.xxx()`

- `getAllTeamsInfo(): Promise<Array<IDMT_TeamItem>>;` — 获取所有直接团队的详细属性
- `getAllInvolvedTeamInfo(): Promise<Array<IDMT_TeamItem>>;` — 获取所有参与的团队的详细属性
- `getCurrentTeamInfo(): Promise<IDMT_TeamItem | undefined>;` — 获取当前团队的详细属性

## DMT_Workspace

调用：`eda.dmt_Workspace.xxx()`

- `getAllWorkspacesInfo(): Promise<Array<IDMT_WorkspaceItem>>;` — 获取所有工作区的详细属性
- `toggleToWorkspace(workspaceUuid?: string): Promise<boolean>;` — 切换到工作区
- `getCurrentWorkspaceInfo(): Promise<IDMT_WorkspaceItem | undefined>;` — 获取当前工作区的详细属性
