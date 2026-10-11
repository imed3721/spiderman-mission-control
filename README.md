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

• Database readiness via `/ready`

• Mission data via `/api/missions`

• Application service status and logs

• ALB target health when the application service is stopped

• Database-connection failure behaviour when the configured password is temporarily incorrect

• Auto Scaling Group replacement behaviour after terminating an instance

*Add links or redacted screenshots of actual successful test runs here.
Clearly label any test that has not yet been repeated on the current
version*

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

- [Source Code](https://github.com/imed3721/spiderman-mission-control)
- [GitHub Actions — CI/CD Workflows](https://github.com/imed3721/spiderman-mission-control/actions)
- [Project Documentation](./docs/)
