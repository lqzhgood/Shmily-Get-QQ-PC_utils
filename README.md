# 说明

请先阅读 https://github.com/lqzhgood/Shmily

此工具是将 QQ 电脑版 `Shmily-Msg` 进一步处理的工具

# 使用

安装 node 环境 [http://lqzhgood.github.io/Shmily/guide/setup-runtime/nodejs.html]

### 合并相关

如果有多份聊天记录(多个设备上导出的), 并且这些聊天记录上有交集, 那么可以用下面的工具将交集部分拆分出来, 进行对比后, 再合并

-   1 slice
    按时间点分割 数据文件

-   3 merger
    合并多个 数据文件

-   4 diff
    对比两个数据文件哪里不同

### 修复一些聊天记录的问题

#### 5 fix

-   修复

    1. 将相应资源文件放入 input 文件夹
        - `./input/data/qq-pc/file`
        - `./input/data/qq-pc/img`
    2. 将数据文件放入 json 文件夹 `./input/msg-qq-pc-mht.json`
    3. 修改 `config.js`
    4. 执行 `node index.js`
    5. 获取产物
        - `/dist/LOST_FILES.json` 数据文件中 双方发送过的文件 丢失列表
        - `/dist/HAS_FILES.json` 数据文件中 双方发送过的文件 存在列表
        - `/dist/msg-qq-pc.json` 修复后的数据文件
        - `file` `img` 修复后的资源文件 (主要修正文件名的一些问题)

-   Tools 一些工具 (非必须)

    -   checkAllImg.js 检查数据文件中的图片是否全部存在
    -   watchState 实时输出放入 input 文件夹中的图片信息

#### 6 slice PC 移动版 去重

MobileQQ 发送一条消息后, 登录 QQ-PC 后会同步这条消息, 导致 QQ-PC 和 MobileQQ 分别导出的数据文件存在重复消息

因为 QQ-PC 无法拿到消息的精确时间(毫秒级)用来做消息 ID, 因此无法精确匹配, 此程序则是根据规则 _尽量_ 删除这些重复消息( 保留 Mobile , 删除 PC )

    - 文件放入 `/input` 文件夹
    - 修改 `config.js`
    - 执行 `node clear.js`
    - 获取 数据文件
        - msg-qq-pc.json
        - countNum.json
            被删除的数据统计 ( key: 连续相同消息次数, value: 被删除消息数量 )
            { 2:100 } 代表以下类型去重100次

            ```
                pc 啥
                pc 哈哈 // 去重
                pc 哈哈 // 去重
                Mobile  ?
                Mobile 哈哈
                Mobile 哈哈
            ```
