# AWS Infrastructure Architecture

## 🏗️ Complete Architecture Diagram

```
                                    INTERNET
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    │            [Route 53 DNS]           │
                    │                  │                  │
                    │                  ↓                  │
                    │          [CloudFront CDN]           │
                    │         (Static Assets)             │
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                                       ↓
┌─────────────────────────────────────────────────────────────────────┐
│                           AWS VPC (10.0.0.0/16)                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    PUBLIC SUBNETS                             │  │
│  │                                                               │  │
│  │  ┌─────────────────────┐      ┌─────────────────────┐       │  │
│  │  │  Public Subnet 1    │      │  Public Subnet 2    │       │  │
│  │  │  (10.0.1.0/24)      │      │  (10.0.2.0/24)      │       │  │
│  │  │  us-east-1a         │      │  us-east-1b         │       │  │
│  │  │                     │      │                     │       │  │
│  │  │  ┌───────────────┐  │      │  ┌───────────────┐  │       │  │
│  │  │  │  Bastion Host │  │      │  │      ALB      │  │       │  │
│  │  │  │  (SSH Jump)   │  │      │  │ Load Balancer │  │       │  │
│  │  │  └───────────────┘  │      │  └───────┬───────┘  │       │  │
│  │  └─────────────────────┘      └──────────┼──────────┘       │  │
│  └───────────────────────────────────────────┼──────────────────┘  │
│                                               │                     │
│                                               ↓                     │
│  ┌────────────────────────────────────[Target Group]───────────┐   │
│  │                                            │                 │   │
│  │  ┌─────────────────────────────────────────┼──────────────┐ │   │
│  │  │               PRIVATE SUBNETS           │              │ │   │
│  │  │                                         │              │ │   │
│  │  │  ┌──────────────────┐    ┌──────────────────┐        │ │   │
│  │  │  │ Private Subnet 1 │    │ Private Subnet 2 │        │ │   │
│  │  │  │ (10.0.10.0/24)   │    │ (10.0.11.0/24)   │        │ │   │
│  │  │  │  us-east-1a      │    │  us-east-1b      │        │ │   │
│  │  │  │                  │    │                  │        │ │   │
│  │  │  │  ┌────────────┐  │    │  ┌────────────┐  │        │ │   │
│  │  │  │  │  EC2 App   │  │    │  │  EC2 App   │  │        │ │   │
│  │  │  │  │ Instance 1 │◄─┼────┼──┤ Instance 2 │  │        │ │   │
│  │  │  │  └─────┬──────┘  │    │  └─────┬──────┘  │        │ │   │
│  │  │  │        │         │    │        │         │        │ │   │
│  │  │  │        │   ┌─────┴────┴────────┴─────┐   │        │ │   │
│  │  │  │        └───┤     EFS File System     │───┘        │ │   │
│  │  │  │            │  (Shared Weather Videos)│            │ │   │
│  │  │  │            └─────────────────────────┘            │ │   │
│  │  │  └──────────────────┬────────────┬──────────────────┘ │   │
│  │  └─────────────────────┼────────────┼────────────────────┘   │
│  │                        │            │                        │
│  │                        ↓            ↓                        │
│  │  ┌─────────────────────────────────────────────────────┐    │
│  │  │             DATABASE SUBNETS (Private)              │    │
│  │  │                                                      │    │
│  │  │  ┌──────────────────┐    ┌──────────────────┐      │    │
│  │  │  │  DB Subnet 1     │    │  DB Subnet 2     │      │    │
│  │  │  │  (10.0.20.0/24)  │    │  (10.0.21.0/24)  │      │    │
│  │  │  │  us-east-1a      │    │  us-east-1b      │      │    │
│  │  │  │                  │    │                  │      │    │
│  │  │  │  ┌────────────┐  │    │  ┌────────────┐  │      │    │
│  │  │  │  │ RDS Primary│◄─┼────┼─►│RDS Standby │  │      │    │
│  │  │  │  │ PostgreSQL │  │    │  │  (Multi-AZ)│  │      │    │
│  │  │  │  └────────────┘  │    │  └────────────┘  │      │    │
│  │  │  └──────────────────┘    └──────────────────┘      │    │
│  │  └─────────────────────────────────────────────────────┘    │
│  └──────────────────────────────────────────────────────────────┘
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   NETWORKING COMPONENTS                     │  │
│  │                                                             │  │
│  │  • Internet Gateway (Public access)                        │  │
│  │  • NAT Gateway (Private subnet internet)                   │  │
│  │  • Route Tables (Traffic routing)                          │  │
│  │  • Network ACLs (Subnet-level firewall)                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

                    MONITORING & MANAGEMENT
                    ┌────────────────────┐
                    │   CloudWatch       │
                    │   • Logs           │
                    │   • Metrics        │
                    │   • Alarms         │
                    └────────────────────┘
                    ┌────────────────────┐
                    │ Systems Manager    │
                    │ • Parameter Store  │
                    │ • Session Manager  │
                    └────────────────────┘
```

---

## 🔐 Security Group Configuration

### 1. ALB Security Group
**Name:** `weather-alb-sg`

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| Inbound | HTTP | 80 | 0.0.0.0/0 | Public web traffic |
| Inbound | HTTPS | 443 | 0.0.0.0/0 | Secure web traffic |
| Outbound | All | All | `weather-ec2-sg` | Forward to EC2 |

### 2. EC2 Application Security Group
**Name:** `weather-ec2-sg`

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| Inbound | TCP | 3000 | `weather-alb-sg` | Node.js app from ALB |
| Inbound | SSH | 22 | `weather-bastion-sg` | SSH from bastion |
| Inbound | NFS | 2049 | `weather-efs-sg` | EFS mount |
| Outbound | PostgreSQL | 5432 | `weather-rds-sg` | Database queries |
| Outbound | HTTPS | 443 | 0.0.0.0/0 | API calls (weather.gov) |
| Outbound | NFS | 2049 | `weather-efs-sg` | EFS access |

### 3. RDS Database Security Group
**Name:** `weather-rds-sg`

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| Inbound | PostgreSQL | 5432 | `weather-ec2-sg` | Database access from app |
| Outbound | - | - | None | No outbound needed |

### 4. EFS Security Group
**Name:** `weather-efs-sg`

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| Inbound | NFS | 2049 | `weather-ec2-sg` | File system access |
| Outbound | NFS | 2049 | `weather-ec2-sg` | File system responses |

### 5. Bastion Host Security Group
**Name:** `weather-bastion-sg`

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| Inbound | SSH | 22 | Your.IP.Address/32 | Admin SSH access |
| Outbound | SSH | 22 | `weather-ec2-sg` | SSH to private instances |

---

## 🌐 Network Architecture Details

### VPC Configuration
```yaml
VPC:
  CIDR: 10.0.0.0/16
  DNS Resolution: Enabled
  DNS Hostnames: Enabled
  
Internet Gateway:
  Name: weather-igw
  Attached to: VPC
  
NAT Gateway:
  Name: weather-nat-gw
  Subnet: Public Subnet 1
  Elastic IP: Allocated
```

### Subnet Details

#### Public Subnets (Internet-facing)
```yaml
Public Subnet 1:
  CIDR: 10.0.1.0/24
  AZ: us-east-1a
  Auto-assign Public IP: Yes
  Route Table: Public RT (0.0.0.0/0 → IGW)
  Resources: Bastion Host
  
Public Subnet 2:
  CIDR: 10.0.2.0/24
  AZ: us-east-1b
  Auto-assign Public IP: Yes
  Route Table: Public RT (0.0.0.0/0 → IGW)
  Resources: ALB
```

#### Private Subnets (Application tier)
```yaml
Private Subnet 1:
  CIDR: 10.0.10.0/24
  AZ: us-east-1a
  Auto-assign Public IP: No
  Route Table: Private RT (0.0.0.0/0 → NAT GW)
  Resources: EC2 App Instances
  
Private Subnet 2:
  CIDR: 10.0.11.0/24
  AZ: us-east-1b
  Auto-assign Public IP: No
  Route Table: Private RT (0.0.0.0/0 → NAT GW)
  Resources: EC2 App Instances
```

#### Database Subnets (Data tier)
```yaml
Database Subnet 1:
  CIDR: 10.0.20.0/24
  AZ: us-east-1a
  Auto-assign Public IP: No
  Route Table: Database RT (Local only)
  Resources: RDS Primary
  
Database Subnet 2:
  CIDR: 10.0.21.0/24
  AZ: us-east-1b
  Auto-assign Public IP: No
  Route Table: Database RT (Local only)
  Resources: RDS Standby
```

---

## 🚀 Auto Scaling Configuration

### Launch Template
```yaml
Name: weather-app-launch-template
AMI: Ubuntu 22.04 LTS
Instance Type: t3.small
Key Pair: your-key-pair
Security Groups: weather-ec2-sg
IAM Role: weather-ec2-role

User Data Script:
  - Install Node.js 18
  - Install PostgreSQL client
  - Install PM2
  - Clone git repository
  - Install npm dependencies
  - Mount EFS
  - Start application with PM2
  - Configure auto-start on boot
```

### Auto Scaling Group
```yaml
Name: weather-app-asg
Launch Template: weather-app-launch-template
VPC: weather-vpc
Subnets: 
  - Private Subnet 1 (us-east-1a)
  - Private Subnet 2 (us-east-1b)
  
Capacity:
  Minimum: 1
  Desired: 2
  Maximum: 4
  
Health Checks:
  Type: ELB
  Grace Period: 300 seconds
  
Target Groups:
  - weather-app-tg (ALB target)
```

### Scaling Policies

#### Scale Out Policy
```yaml
Name: weather-scale-out
Type: Target Tracking
Metric: Average CPU Utilization
Target Value: 70%
Cooldown: 300 seconds
Instances to Add: 1
```

#### Scale In Policy
```yaml
Name: weather-scale-in
Type: Target Tracking
Metric: Average CPU Utilization
Target Value: 30%
Cooldown: 600 seconds
Instances to Remove: 1
```

---

## 💾 Storage Configuration

### EFS (Elastic File System)
```yaml
File System:
  Name: weather-efs
  Performance Mode: General Purpose
  Throughput Mode: Bursting
  Encryption: Enabled (AES-256)
  
Mount Targets:
  - Subnet: Private Subnet 1
    Security Group: weather-efs-sg
    IP: 10.0.10.50
  - Subnet: Private Subnet 2
    Security Group: weather-efs-sg
    IP: 10.0.11.50
    
Storage:
  Weather Videos: ~10 GB
  Application Logs: ~1 GB
  Shared Config: ~100 MB
```

### RDS PostgreSQL
```yaml
Database:
  Engine: PostgreSQL 14
  Instance Class: db.t3.micro
  Storage: 20 GB (gp3)
  Multi-AZ: Yes
  
Connection:
  Endpoint: weather-db.xxxxx.us-east-1.rds.amazonaws.com
  Port: 5432
  Database Name: weather_db
  
Backup:
  Automated Backups: Enabled
  Retention: 7 days
  Backup Window: 03:00-04:00 UTC
  Maintenance Window: Sun 04:00-05:00 UTC
  
Security:
  Encryption at Rest: Yes
  Encryption in Transit: Yes (SSL/TLS)
  Security Group: weather-rds-sg
```

---

## 📊 Monitoring Setup

### CloudWatch Alarms

#### High CPU Alarm
```yaml
Alarm Name: weather-high-cpu
Metric: CPUUtilization
Threshold: > 80%
Evaluation Periods: 2
Period: 300 seconds
Action: Send SNS notification
```

#### Low Memory Alarm
```yaml
Alarm Name: weather-low-memory
Metric: MemoryUtilization
Threshold: < 20%
Evaluation Periods: 2
Period: 300 seconds
Action: Send SNS notification
```

#### ALB Unhealthy Targets
```yaml
Alarm Name: weather-unhealthy-targets
Metric: UnhealthyHostCount
Threshold: >= 1
Evaluation Periods: 2
Period: 60 seconds
Action: Send SNS notification
```

### CloudWatch Logs
```yaml
Log Groups:
  - /aws/ec2/weather-app/application
  - /aws/ec2/weather-app/access
  - /aws/rds/weather-db/error
  - /aws/rds/weather-db/slowquery
  
Retention: 30 days
```

---

## 💰 Cost Breakdown

### Monthly Estimates

| Service | Type | Quantity | Monthly Cost |
|---------|------|----------|--------------|
| EC2 | t3.small | 2 instances | $30.00 |
| RDS | db.t3.micro | 1 instance | $15.00 |
| ALB | Application LB | 1 | $16.20 |
| EFS | Storage | 100 GB | $30.00 |
| NAT Gateway | Data transfer | 1 | $32.40 |
| Data Transfer | Out to Internet | 50 GB | $4.50 |
| CloudWatch | Logs & Metrics | Standard | $5.00 |
| **Total** | | | **~$133.10** |

### Cost Optimization Tips
- Use Reserved Instances for 40% savings
- Enable S3 Intelligent-Tiering for videos
- Implement CloudFront CDN to reduce data transfer
- Use Spot Instances for dev/test environments
- Schedule auto-scaling to match traffic patterns

---

## 🔄 Traffic Flow

### User Request Flow
```
1. User → Route 53 (DNS resolution)
2. Route 53 → CloudFront (CDN cache check)
3. CloudFront → ALB (if cache miss)
4. ALB → Target Group (health check)
5. Target Group → EC2 Instance (round-robin)
6. EC2 → RDS (database query)
7. EC2 → EFS (static file read)
8. EC2 → Weather.gov API (weather data)
9. EC2 → ALB (response)
10. ALB → User (HTTP response)
```

### SSH Access Flow
```
1. Admin → Bastion Host (SSH port 22)
2. Bastion → Private EC2 (SSH port 22)
3. Admin → Systems Manager Session Manager (alternative)
```

---

## 📝 Deployment Checklist

### Initial Setup
- [ ] Create VPC with subnets
- [ ] Create Internet Gateway
- [ ] Create NAT Gateway
- [ ] Configure route tables
- [ ] Create security groups
- [ ] Create RDS database
- [ ] Create EFS file system
- [ ] Upload videos to EFS
- [ ] Create launch template
- [ ] Create target group
- [ ] Create ALB
- [ ] Create auto scaling group
- [ ] Configure CloudWatch alarms
- [ ] Test health checks
- [ ] Configure Route 53 (optional)
- [ ] Set up CloudFront (optional)

### Post-Deployment
- [ ] Verify EC2 instances are healthy
- [ ] Test database connectivity
- [ ] Verify EFS mount
- [ ] Test application functionality
- [ ] Check CloudWatch logs
- [ ] Monitor auto scaling
- [ ] Test bastion access
- [ ] Verify backups are running
- [ ] Document endpoints and IPs
- [ ] Update DNS records

---

This architecture provides:
- ✅ High availability across 2 AZs
- ✅ Auto-scaling based on demand
- ✅ Secure multi-tier architecture
- ✅ Isolated database layer
- ✅ Shared storage for consistency
- ✅ Comprehensive monitoring
- ✅ Cost-optimized configuration
