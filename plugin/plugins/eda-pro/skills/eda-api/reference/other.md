# OTHER_* — 其他

## IPCB_ComplexPolygon

调用：`eda.ipcb_ComplexPolygon.xxx()`

- `addSource(complexPolygon: TPCB_PolygonSourceArray | Array<TPCB_PolygonSourceArray> | IPCB_Polygon | Array<IPCB_Polygon>): IPCB_ComplexPolygon;` — 添加多边形数据
- `getSource(): TPCB_PolygonSourceArray | Array<TPCB_PolygonSourceArray>;` — 获取多边形数据
- `getSourceStrictComplex(): Array<TPCB_PolygonSourceArray>;` — 获取复杂多边形数据
- `getCenter(): {` — 获取复杂多边形中心点
- `toPolygon(): Array<IPCB_Polygon>;` — 拆分为单多边形数组

## IPCB_Polygon

调用：`eda.ipcb_Polygon.xxx()`

- `getSource(): TPCB_PolygonSourceArray;` — 获取单多边形数据
- `getCenter(): Promise<{` — 获取单多边形中心点
- `discretize(options?: IPCB_DiscretizeOptions): Array<IPCB_DiscretizedPoint>;` — 将单多边形离散化为点数据
