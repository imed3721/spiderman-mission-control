# Spiderman Mission Control

A learning project demonstrating how to deploy and operate a small
Node.js task application using AWS infrastructure and a GitHub Actions
delivery workflow.

## Overview
Spider-Man Mission Control is a simple mission/task-list application built
to explore the DevOps work around a three-tier application: traffic
routing, compute, database connectivity, configuration management,
deployment automation, health checks, and failure testing.

## Architecture
**Request path:** Internet → Application Load Balancer → EC2 (Node.js/
Express) → Amazon RDS for PostgreSQL.

The EC2 application retrieves database connection parameters from
AWS Systems Manager Parameter Store using an EC2 IAM role. The
database password should be stored as a SecureString.

*add Architecture diagram*

## Technology
**• AWS:** VPC, public/private subnets, Application Load Balancer, EC2, RDS PostgreSQL, IAM, Systems Manager Parameter Store, Systems Manager Session Manager, CloudWatch

**• Application:** Node.js, Express, PostgreSQL, HTML, CSS

**• Automation:** GitHub Actions, npm tests, AWS CLI, Systems Manager Run Command


## Architecture and Deployment

• The Application Load Balancer (ALB) serves as the public entry point and forwards HTTP traffic to the Node.js application running on EC2 on port 3000.

• The EC2 security group is configured to restrict application traffic to requests originating from the ALB security group.

• The PostgreSQL RDS database is deployed in private subnets, with public access disabled and inbound database traffic restricted to the EC2 security group.

• Database configuration and credentials are retrieved from AWS Systems Manager Parameter Store rather than hard-coded into the application.

• The application provides `/health`, `/ready`, and `/api/missions` endpoints for health checks, database readiness checks, and mission data retrieval, respectively.

• GitHub Actions validates project files, installs dependencies, runs tests, and uses AWS Systems Manager Run Command to execute remote deployment commands and verify application readiness.
  
• AWS Systems Manager Session Manager provides secure interactive access to the EC2 instance without requiring SSH access or inbound port 22.

## Testing and operations

The project guide describes these checks:

• Application health via `/health`

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/4fe49a853284caee117249d937130d8af43e04e4/screenshots/Screenshot%202026-10-11%20at%2012.11.16.png)

• Database readiness via `/ready`

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/4fe49a853284caee117249d937130d8af43e04e4/screenshots/Screenshot%202026-10-11%20at%2012.11.27.png)

• Mission data via `/api/missions`

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/4fe49a853284caee117249d937130d8af43e04e4/screenshots/Screenshot%202026-10-11%20at%2012.11.36.png)

• ALB target health when the application service is stopped

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/e71482e8ed7c6c9cbb789c0af879ac0a45122799/screenshots/Screenshot%202026-10-11%20at%2012.23.06.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/e71482e8ed7c6c9cbb789c0af879ac0a45122799/screenshots/Screenshot%202026-10-11%20at%2012.23.14.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/e71482e8ed7c6c9cbb789c0af879ac0a45122799/screenshots/Screenshot%202026-10-11%20at%2012.23.22.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/e71482e8ed7c6c9cbb789c0af879ac0a45122799/screenshots/Screenshot%202026-10-11%20at%2012.23.29.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/e71482e8ed7c6c9cbb789c0af879ac0a45122799/screenshots/Screenshot%202026-10-11%20at%2012.23.37.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/e71482e8ed7c6c9cbb789c0af879ac0a45122799/screenshots/Screenshot%202026-10-11%20at%2012.23.45.png)

• Database-connection failure behaviour when the configured password is temporarily incorrect

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.31.15.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.31.23.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.31.45.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.31.52.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.31.58.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.32.14.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.32.21.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.32.34.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/42db404300168cc94e9b23c6cdce1d3154298c2b/screenshots/Screenshot%202026-10-11%20at%2012.32.41.png)

• Auto Scaling Group replacement behaviour after terminating an instance

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.42.38.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.43.14.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.43.30.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.43.37.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.44.08.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.44.30.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.44.39.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.44.49.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.44.56.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/6a53c88b8953780e18ab175e5723aa779aef5998/screenshots/Screenshot%202026-10-11%20at%2012.45.06.png)

• Application service status and logs

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/d1633e54c8139200b1ffa4c2f590ca029d58bd46/screenshots/Screenshot%202026-10-11%20at%2012.52.53.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/d1633e54c8139200b1ffa4c2f590ca029d58bd46/screenshots/Screenshot%202026-10-11%20at%2012.51.51.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/d1633e54c8139200b1ffa4c2f590ca029d58bd46/screenshots/Screenshot%202026-10-11%20at%2012.52.11.png)

![image alt](https://github.com/imed3721/spiderman-mission-control/blob/d1633e54c8139200b1ffa4c2f590ca029d58bd46/screenshots/Screenshot%202026-10-11%20at%2012.52.17.png)

## Limitations and next improvements

• The documented RDS configuration is Single-AZ, so database
Multi-AZ failover is not configured. 

• The documented ALB listener uses HTTP; add HTTPS with an
ACM certificate before presenting the app as production-ready.

• The workflow currently uses long-lived AWS access keys stored in
GitHub Actions secrets. A planned improvement is GitHub Actions
OIDC with a narrowly scoped IAM role.

• An Auto Scaling Group configured with minimum, desired, and
maximum capacity of 1 demonstrates instance replacement, not
load-based horizontal scaling.

• The current documentation and application/test code must use the
same Systems Manager Parameter Store paths. Verify that
server.js, test.js, and the AWS parameters agree before
relying on the CI/CD result.

## Documentation

• [Source Code](https://github.com/imed3721/spiderman-mission-control)

• [GitHub Actions — CI/CD Workflows](https://github.com/imed3721/spiderman-mission-control/actions)

• [Project Documentation](./docs/)

## What I learned

This project strengthened my practical skills in AWS network segmentation, security group design, and managed database connectivity. I also gained hands-on experience with secure application configuration using AWS Systems Manager Parameter Store, automated deployments through GitHub Actions and Systems Manager Run Command, and implementing application health and readiness checks. Additionally, I developed my troubleshooting skills by analysing service logs, investigating database connectivity issues, and diagnosing application failures through load balancer target health.
