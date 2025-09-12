#!/bin/bash

# 数据库备份脚本
# 支持本地和远程PostgreSQL数据库备份

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置区域
BACKUP_DIR="/home/dayu/XAIAgentPlatform/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$BACKUP_DIR/logs/backup_$DATE.log"

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
    # 解析格式: postgresql://user:password@host:port/dbname
    DB_USER=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@[^:]*:\([^/]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^/]*\/\([^?]*\).*/\1/p')
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        echo -e "${GREEN}创建备份目录: $BACKUP_DIR${NC}"
    fi
    if [ ! -d "$BACKUP_DIR/logs" ]; then
        mkdir -p "$BACKUP_DIR/logs"
        echo -e "${GREEN}创建日志目录: $BACKUP_DIR/logs${NC}"
    fi
}

# 执行备份
backup_database() {
    echo -e "${YELLOW}开始备份数据库...${NC}"
    echo "备份时间: $(date)" >> "$LOG_FILE"
    
    BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_$DATE.sql"
    
    # 设置环境变量
    export PGPASSWORD="$DB_PASSWORD"
    
    # 执行pg_dump
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges > "$BACKUP_FILE" 2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        # 创建压缩版本，同时保留原始SQL文件
        gzip -k "$BACKUP_FILE"  # -k 参数保留原始文件
        COMPRESSED_FILE="$BACKUP_FILE.gz"
        
        echo -e "${GREEN}备份成功!${NC}"
        echo "SQL文件: $BACKUP_FILE"
        echo "压缩文件: $COMPRESSED_FILE"
        echo "SQL文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
        echo "压缩文件大小: $(du -h "$COMPRESSED_FILE" | cut -f1)"
        echo "备份完成: $(date)" >> "$LOG_FILE"
        
        # 清理旧备份（保留最近30个）
        cleanup_old_backups
    else
        echo -e "${RED}备份失败! 请检查日志: $LOG_FILE${NC}"
        exit 1
    fi
    
    unset PGPASSWORD
}

# 清理旧备份文件
cleanup_old_backups() {
    echo -e "${YELLOW}清理旧备份文件...${NC}"
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +30 -delete
    echo -e "${GREEN}清理完成${NC}"
}

# Prisma schema备份
backup_prisma_schema() {
    if [ -f "prisma/schema.prisma" ]; then
        cp "prisma/schema.prisma" "$BACKUP_DIR/schema_$DATE.prisma"
        echo -e "${GREEN}Prisma schema已备份${NC}"
    fi
}

# 主函数
main() {
    echo -e "${GREEN}=== 数据库备份脚本 ===${NC}"
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}错误: 未找到DATABASE_URL${NC}"
        exit 1
    fi
    
    parse_database_url
    create_backup_dir
    backup_database
    backup_prisma_schema
    
    echo -e "${GREEN}备份任务完成!${NC}"
}

# 运行主函数
main "$@"