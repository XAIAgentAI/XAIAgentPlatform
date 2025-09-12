#!/bin/bash

# 数据库恢复脚本
# 用于从备份文件恢复PostgreSQL数据库

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置区域
BACKUP_DIR="/home/dayu/XAIAgentPlatform/backups"

# 从.env文件读取数据库URL
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')
else
    echo -e "${RED}错误: 找不到.env文件: $ENV_FILE${NC}"
    exit 1
fi

# 解析数据库URL
parse_database_url() {
    DB_USER=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@[^:]*:\([^/]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^/]*\/\([^?]*\).*/\1/p')
}

# 显示可用的备份文件
list_backups() {
    echo -e "${YELLOW}可用的备份文件:${NC}"
    ls -la "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | nl
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}错误: 备份文件不存在: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}准备恢复数据库...${NC}"
    echo -e "${RED}警告: 这将清除当前数据库中的所有数据!${NC}"
    read -p "确认继续? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
    
    # 设置环境变量
    export PGPASSWORD="$DB_PASSWORD"
    
    # 解压并恢复
    echo -e "${YELLOW}开始恢复数据库...${NC}"
    
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}数据库恢复成功!${NC}"
        echo -e "${YELLOW}请运行 prisma generate 来更新Prisma客户端${NC}"
    else
        echo -e "${RED}数据库恢复失败!${NC}"
        exit 1
    fi
    
    unset PGPASSWORD
}

# 主函数
main() {
    echo -e "${GREEN}=== 数据库恢复脚本 ===${NC}"
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}错误: 未找到DATABASE_URL${NC}"
        exit 1
    fi
    
    parse_database_url
    
    if [ -z "$1" ]; then
        list_backups
        echo ""
        echo "使用方法: $0 <备份文件路径>"
        echo "例如: $0 $BACKUP_DIR/backup_xai-agent-prod_20240101_120000.sql.gz"
        exit 1
    fi
    
    restore_database "$1"
}

# 运行主函数
main "$@"