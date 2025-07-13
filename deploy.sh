#!/bin/bash

# 学生任务管理系统一键部署脚本
# 使用方法: ./deploy.sh [环境变量文件]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# 检查Docker是否安装
check_docker() {
    log "检查Docker环境..."
    if ! command -v docker &> /dev/null; then
        error "Docker未安装，请先安装Docker"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose未安装，请先安装Docker Compose"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker服务未启动，请启动Docker服务"
    fi
    
    log "Docker环境检查通过"
}

# 检查环境变量文件
check_env_file() {
    local env_file=${1:-docker.env}
    
    if [ ! -f "$env_file" ]; then
        warn "环境变量文件 $env_file 不存在"
        if [ -f "docker.env.example" ]; then
            log "正在复制环境变量模板文件..."
            cp docker.env.example "$env_file"
            warn "请编辑 $env_file 文件，设置正确的配置参数"
            error "部署前请先配置环境变量"
        else
            error "未找到环境变量模板文件 docker.env.example"
        fi
    fi
    
    # 检查必需的环境变量
    source "$env_file"
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-strong-jwt-secret-key-here" ]; then
        error "请设置 JWT_SECRET 环境变量"
    fi
    
    log "环境变量检查通过"
}

# 拉取最新镜像
pull_image() {
    log "拉取最新Docker镜像..."
    docker pull doramart/student-task:latest
    log "镜像拉取完成"
}

# 停止现有服务
stop_services() {
    log "停止现有服务..."
    docker-compose down --remove-orphans
    log "服务停止完成"
}

# 启动服务
start_services() {
    local env_file=${1:-docker.env}
    
    log "启动服务..."
    docker-compose --env-file "$env_file" up -d
    
    log "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log "服务启动成功"
    else
        error "服务启动失败，请检查日志"
    fi
}

# 检查服务健康状态
check_health() {
    log "检查服务健康状态..."
    
    # 等待MongoDB启动
    log "等待MongoDB启动..."
    for i in {1..30}; do
        if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" &> /dev/null; then
            log "MongoDB启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            error "MongoDB启动超时"
        fi
        sleep 2
    done
    
    # 等待应用启动
    log "等待应用启动..."
    for i in {1..60}; do
        if curl -f http://localhost:7801/api/health &> /dev/null; then
            log "应用启动成功"
            break
        fi
        if [ $i -eq 60 ]; then
            error "应用启动超时"
        fi
        sleep 2
    done
    
    log "所有服务健康检查通过"
}

# 显示部署信息
show_info() {
    log "=========================================="
    log "部署完成！"
    log "=========================================="
    log "应用地址: http://localhost:7801"
    log "API地址: http://localhost:7801/api"
    log "健康检查: http://localhost:7801/api/health"
    log ""
    log "默认用户: demo@student-task.com"
    log "数据库: MongoDB (localhost:27017)"
    log ""
    log "查看日志: docker-compose logs -f"
    log "停止服务: docker-compose down"
    log "重启服务: docker-compose restart"
    log "=========================================="
}

# 主函数
main() {
    local env_file=${1:-docker.env}
    
    log "=========================================="
    log "学生任务管理系统一键部署"
    log "=========================================="
    
    # 检查环境
    check_docker
    check_env_file "$env_file"
    
    # 拉取镜像
    pull_image
    
    # 停止现有服务
    stop_services
    
    # 启动服务
    start_services "$env_file"
    
    # 检查健康状态
    check_health
    
    # 显示部署信息
    show_info
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi 