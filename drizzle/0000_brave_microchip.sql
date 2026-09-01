CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`gymId` int NOT NULL,
	`checkedInAt` timestamp NOT NULL DEFAULT (now()),
	`method` varchar(40) NOT NULL DEFAULT 'front-desk',
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gyms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`ownerId` int NOT NULL,
	`location` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gyms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gymId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`status` enum('active','paused','expired') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`gymId` int NOT NULL,
	`plan` varchar(120) NOT NULL,
	`price` decimal(10,2) NOT NULL DEFAULT '0',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('active','pending','expired','cancelled') NOT NULL DEFAULT 'active',
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`gymId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('paid','pending','failed','refunded') NOT NULL DEFAULT 'paid',
	`reference` varchar(120),
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `workoutPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gymId` int NOT NULL,
	`memberId` int,
	`trainerId` int,
	`title` varchar(160) NOT NULL,
	`focus` varchar(120),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workoutPlans_id` PRIMARY KEY(`id`)
);
