#!/bin/bash

# PostgreSQL + PgBouncer Installation Script for Ubuntu 25
# Run as root or with sudo

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables - CHANGE THESE
DB_NAME="myapp_db"
DB_USER="postgres"
DB_PASSWORD="53086f!fa21f4d5a8be6615e594c.4c1dc#b25304fd02928963a86$89d18e25a70@69"
PGBOUNCER_PORT=6432
POSTGRES_PORT=5432
# Optimized for Vercel serverless functions
MAX_CLIENT_CONN=200
DEFAULT_POOL_SIZE=25
MIN_POOL_SIZE=10
RESERVE_POOL_SIZE=10
SERVER_IDLE_TIMEOUT=60

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PostgreSQL + PgBouncer Installation${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}" 
   exit 1
fi

# Update system
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install PostgreSQL
echo -e "${YELLOW}[2/8] Installing PostgreSQL...${NC}"
apt install postgresql postgresql-contrib -y

# Wait for PostgreSQL to start
sleep 5

# Configure PostgreSQL
echo -e "${YELLOW}[3/8] Configuring PostgreSQL...${NC}"
sudo -u postgres psql <<EOF
ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME;
EOF

# Configure PostgreSQL to listen on localhost
echo -e "${YELLOW}[4/8] Configuring PostgreSQL connection settings...${NC}"
PG_VERSION=$(sudo -u postgres psql -t -c "SHOW server_version;" | cut -d'.' -f1 | xargs)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

# Ensure PostgreSQL listens on localhost
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" $PG_CONF

# Add md5 authentication for local connections
if ! grep -q "host.*all.*all.*127.0.0.1/32.*md5" $PG_HBA; then
    echo "host    all             all             127.0.0.1/32            md5" >> $PG_HBA
fi

# Restart PostgreSQL
systemctl restart postgresql

# Install PgBouncer
echo -e "${YELLOW}[5/8] Installing PgBouncer...${NC}"
apt install pgbouncer -y

# Generate MD5 hash for userlist
echo -e "${YELLOW}[6/8] Configuring PgBouncer authentication...${NC}"
MD5_HASH=$(echo -n "${DB_PASSWORD}${DB_USER}" | md5sum | cut -d' ' -f1)

# Create userlist.txt
cat > /etc/pgbouncer/userlist.txt <<EOF
"$DB_USER" "md5$MD5_HASH"
EOF

chmod 640 /etc/pgbouncer/userlist.txt
chown postgres:postgres /etc/pgbouncer/userlist.txt

# Configure PgBouncer
echo -e "${YELLOW}[7/8] Configuring PgBouncer settings...${NC}"
cat > /etc/pgbouncer/pgbouncer.ini <<EOF
[databases]
$DB_NAME = host=127.0.0.1 port=$POSTGRES_PORT dbname=$DB_NAME
* = host=127.0.0.1 port=$POSTGRES_PORT

[pgbouncer]
listen_addr = *
listen_port = $PGBOUNCER_PORT
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/postgresql/pgbouncer.log
pidfile = /var/run/postgresql/pgbouncer.pid
admin_users = $DB_USER

# Optimized for serverless (Vercel functions)
pool_mode = transaction
max_client_conn = $MAX_CLIENT_CONN
default_pool_size = $DEFAULT_POOL_SIZE
min_pool_size = $MIN_POOL_SIZE
reserve_pool_size = $RESERVE_POOL_SIZE
reserve_pool_timeout = 3

# Connection handling
server_reset_query = DISCARD ALL
server_check_delay = 30
server_lifetime = 3600
server_idle_timeout = $SERVER_IDLE_TIMEOUT
server_connect_timeout = 15
server_login_retry = 15

# Query timeouts
query_timeout = 30
query_wait_timeout = 120
client_idle_timeout = 300

# TLS/SSL - Uncomment if using SSL
; server_tls_sslmode = prefer
; client_tls_sslmode = prefer
EOF

# Start and enable PgBouncer
echo -e "${YELLOW}[8/8] Starting PgBouncer...${NC}"
systemctl restart pgbouncer
systemctl enable pgbouncer
systemctl enable postgresql

# Wait a moment for services to start
sleep 3

# Configure firewall for external access
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow $PGBOUNCER_PORT/tcp comment 'PgBouncer'
ufw allow OpenSSH
ufw --force enable

# Verify installation
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check PostgreSQL status
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
fi

# Check PgBouncer status
if systemctl is-active --quiet pgbouncer; then
    echo -e "${GREEN}✓ PgBouncer is running${NC}"
else
    echo -e "${RED}✗ PgBouncer is not running${NC}"
fi

echo ""
echo -e "${YELLOW}Connection Details:${NC}"
echo "  Database Name: $DB_NAME"
echo "  Database User: $DB_USER"
echo "  Database Password: $DB_PASSWORD"
echo ""
echo -e "${YELLOW}Vercel Connection String (use in .env):${NC}"
DROPLET_IP=$(curl -s ifconfig.me)
echo "  DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@$DROPLET_IP:$PGBOUNCER_PORT/$DB_NAME"
echo ""
echo -e "${YELLOW}Direct PostgreSQL Connection (local only):${NC}"
echo "  Host: 127.0.0.1"
echo "  Port: $POSTGRES_PORT"
echo "  Command: PGPASSWORD='$DB_PASSWORD' psql -h 127.0.0.1 -p $POSTGRES_PORT -U $DB_USER $DB_NAME"
echo ""
echo -e "${YELLOW}PgBouncer Connection (external access enabled):${NC}"
echo "  Host: $DROPLET_IP"
echo "  Port: $PGBOUNCER_PORT"
echo "  Command: PGPASSWORD='$DB_PASSWORD' psql -h $DROPLET_IP -p $PGBOUNCER_PORT -U $DB_USER $DB_NAME"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  PgBouncer Config: /etc/pgbouncer/pgbouncer.ini"
echo "  PgBouncer Users: /etc/pgbouncer/userlist.txt"
echo "  PgBouncer Log: /var/log/postgresql/pgbouncer.log"
echo "  PostgreSQL Config: $PG_CONF"
echo ""
echo -e "${GREEN}Next.js/Vercel Setup:${NC}"
echo "1. Add DATABASE_URL to your Vercel environment variables"
echo "2. Install pg or @vercel/postgres in your project"
echo "3. Use 'transaction' pool mode compatible with serverless"
echo ""
echo -e "${RED}SECURITY REMINDERS:${NC}"
echo "- Change the default password in this script before production use"
echo "- Consider setting up SSL/TLS for PgBouncer"
echo "- Whitelist only Vercel IPs in your firewall if possible"
echo "- Keep your credentials in Vercel environment variables, not in code"
echo ""