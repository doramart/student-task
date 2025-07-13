#!/bin/bash
set -e

# 函数：输出带颜色的日志
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ENTRYPOINT] $1"
}

# 函数：检查必需的环境变量
check_env() {
    log "检查必需的环境变量..."
    
    if [ -z "$MONGODB_URL" ]; then
        log "错误: MONGODB_URL 环境变量未设置"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        log "错误: JWT_SECRET 环境变量未设置"
        exit 1
    fi
    
    log "环境变量检查通过"
}

# 函数：等待 MongoDB 连接
wait_for_mongodb() {
    log "等待 MongoDB 连接..."
    
    # 从 MONGODB_URL 中提取主机和端口
    if [[ $MONGODB_URL =~ mongodb://([^:]+):([0-9]+)/ ]]; then
        MONGO_HOST="${BASH_REMATCH[1]}"
        MONGO_PORT="${BASH_REMATCH[2]}"
    elif [[ $MONGODB_URL =~ mongodb://([^/]+)/ ]]; then
        MONGO_HOST="${BASH_REMATCH[1]}"
        MONGO_PORT="27017"
    else
        log "警告: 无法解析 MongoDB URL，跳过连接检查"
        return 0
    fi
    
    # 等待 MongoDB 服务可用
    for i in {1..30}; do
        if nc -z "$MONGO_HOST" "$MONGO_PORT" 2>/dev/null; then
            log "MongoDB 连接成功 ($MONGO_HOST:$MONGO_PORT)"
            return 0
        fi
        log "等待 MongoDB 连接... (尝试 $i/30)"
        sleep 2
    done
    
    log "错误: MongoDB 连接超时"
    exit 1
}

# 函数：初始化应用
init_app() {
    log "初始化应用..."
    
    # 确保日志目录存在
    mkdir -p logs
    
    # 如果存在初始化脚本，则运行
    if [ -f "./scripts/init.js" ]; then
        log "运行初始化脚本..."
        node ./scripts/init.js
    fi
    
    log "应用初始化完成"
}

# 主函数
main() {
    log "=========================================="
    log "学生任务管理系统 Docker 启动"
    log "=========================================="
    
    # 检查环境变量
    check_env
    
    # 等待 MongoDB
    wait_for_mongodb
    
    # 初始化应用
    init_app
    
    log "启动应用服务..."
    log "=========================================="
    
    # 执行传入的命令
    exec "$@"
}

# 如果脚本被直接执行，则运行主函数
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi 