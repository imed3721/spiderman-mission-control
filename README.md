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
