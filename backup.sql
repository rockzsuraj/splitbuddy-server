-- MySQL dump 10.13  Distrib 9.3.0, for macos15.4 (arm64)
--
-- Host: 127.0.0.1    Database: splitbuddy_db
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `expense_shares`
--

DROP TABLE IF EXISTS `expense_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_shares` (
  `share_id` int unsigned NOT NULL AUTO_INCREMENT,
  `expense_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `share_amount` decimal(10,2) NOT NULL,
  `is_settled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`share_id`),
  KEY `expense_id` (`expense_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `expense_shares_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `user_expenses` (`expense_id`) ON DELETE CASCADE,
  CONSTRAINT `expense_shares_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_shares`
--

LOCK TABLES `expense_shares` WRITE;
/*!40000 ALTER TABLE `expense_shares` DISABLE KEYS */;
/*!40000 ALTER TABLE `expense_shares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knex_migrations`
--

DROP TABLE IF EXISTS `knex_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knex_migrations`
--

LOCK TABLES `knex_migrations` WRITE;
/*!40000 ALTER TABLE `knex_migrations` DISABLE KEYS */;
INSERT INTO `knex_migrations` VALUES (1,'20250626081029_init_table.js',1,'2025-06-26 08:19:14'),(2,'20250626203549_ADD_COLUMN_HASH_TOKEN.js',2,'2025-06-26 20:37:38'),(3,'20250627045145_ADD_COLUMN_REFRESH_TOKEN.js',3,'2025-06-27 05:07:40'),(4,'20250627165631_ADDED_COLUMN_refreshTokenExpiresAt.js',4,'2025-06-27 17:16:29'),(5,'20250627172604_refreshTokenExpiresAt_refreshToken_nullable.js',5,'2025-06-27 17:35:39'),(6,'20250628103826_Add_refresh_token_signature.js',6,'2025-06-28 10:41:23'),(9,'20250628122559_change.js',7,'2025-06-29 05:08:13'),(10,'20250629045227_ADD_COLUMN_GOOGLE_ID.js',8,'2025-06-29 05:17:25');
/*!40000 ALTER TABLE `knex_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knex_migrations_lock`
--

DROP TABLE IF EXISTS `knex_migrations_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations_lock` (
  `index` int unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knex_migrations_lock`
--

LOCK TABLES `knex_migrations_lock` WRITE;
/*!40000 ALTER TABLE `knex_migrations_lock` DISABLE KEYS */;
INSERT INTO `knex_migrations_lock` VALUES (1,0);
/*!40000 ALTER TABLE `knex_migrations_lock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token` varchar(255) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_resets_user_id_unique` (`user_id`),
  UNIQUE KEY `password_resets_token_unique` (`token`),
  KEY `idx_password_resets_user_id` (`user_id`),
  KEY `idx_password_resets_expires_at` (`expires_at`),
  CONSTRAINT `password_resets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settlements`
--

DROP TABLE IF EXISTS `settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlements` (
  `settlement_id` int unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int unsigned NOT NULL,
  `from_user` int unsigned NOT NULL,
  `to_user` int unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `settled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_paid` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`settlement_id`),
  KEY `group_id` (`group_id`),
  KEY `from_user` (`from_user`),
  KEY `to_user` (`to_user`),
  CONSTRAINT `settlements_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`group_id`),
  CONSTRAINT `settlements_ibfk_2` FOREIGN KEY (`from_user`) REFERENCES `users` (`id`),
  CONSTRAINT `settlements_ibfk_3` FOREIGN KEY (`to_user`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settlements`
--

LOCK TABLES `settlements` WRITE;
/*!40000 ALTER TABLE `settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_expenses`
--

DROP TABLE IF EXISTS `user_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_expenses` (
  `expense_id` int unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int unsigned NOT NULL,
  `paid_by` int unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `expense_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`expense_id`),
  KEY `group_id` (`group_id`),
  KEY `paid_by` (`paid_by`),
  CONSTRAINT `user_expenses_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `user_expenses_ibfk_2` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_expenses`
--

LOCK TABLES `user_expenses` WRITE;
/*!40000 ALTER TABLE `user_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_group_members`
--

DROP TABLE IF EXISTS `user_group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_group_members` (
  `group_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `user_group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_group_members`
--

LOCK TABLES `user_group_members` WRITE;
/*!40000 ALTER TABLE `user_group_members` DISABLE KEYS */;
INSERT INTO `user_group_members` VALUES (6,7,'2025-10-30 16:07:55'),(8,3,'2025-10-30 16:28:50'),(8,5,'2025-10-30 16:29:24'),(8,7,'2025-10-30 16:10:26');
/*!40000 ALTER TABLE `user_group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_groups`
--

DROP TABLE IF EXISTS `user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_groups` (
  `group_id` int unsigned NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) NOT NULL,
  `description` text,
  `created_by` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `user_groups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_groups`
--

LOCK TABLES `user_groups` WRITE;
/*!40000 ALTER TABLE `user_groups` DISABLE KEYS */;
INSERT INTO `user_groups` VALUES (1,'test44 update','test3',2,'2025-07-06 10:20:09'),(6,'test44 update','test3',2,'2025-07-06 10:22:56'),(7,'test44 update','test3',2,'2025-07-06 10:23:23'),(8,'test44 update','test3',2,'2025-10-30 16:09:23');
/*!40000 ALTER TABLE `user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_sessions_user_id_unique` (`user_id`),
  UNIQUE KEY `user_sessions_session_token_unique` (`session_token`),
  KEY `idx_user_sessions_user_id` (`user_id`),
  KEY `idx_user_sessions_expires_at` (`expires_at`),
  CONSTRAINT `user_sessions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `image_url` varchar(255) DEFAULT '',
  `role` enum('user','admin','moderator') DEFAULT 'user',
  `verified` tinyint(1) DEFAULT '0',
  `status` enum('active','suspended','pending') DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `refresh_token` varchar(255) DEFAULT NULL,
  `refresh_token_expires_at` timestamp NULL DEFAULT NULL,
  `token_signature` varchar(255) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_username` (`username`),
  UNIQUE KEY `uc_email` (`email`),
  UNIQUE KEY `users_google_id_unique` (`google_id`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_created_at` (`created_at`),
  KEY `idx_users_refresh_token` (`refresh_token`),
  KEY `idx_users_google_id` (`google_id`),
  CONSTRAINT `chk_password_length` CHECK ((char_length(`password`) >= 8)),
  CONSTRAINT `chk_username_length` CHECK ((char_length(`username`) >= 3))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'testuser','test4@gmail.com','$2b$10$UbHBuVZmp7KOwh2rgahIIeaw6dyDmr1attCe/aGIrDxNaAYBmHXLa','suraj','kumar','','user',0,'active','2025-10-30 18:19:32','2025-06-28 18:14:16','2025-06-28 18:14:16','$2b$12$qrGz/A/1ICxEnHY0f.x0ruYGohRKngT21oKVW.NE4gcYHl2rdJfJu','2025-11-06 18:19:32','1bdd3c8be69f33b79d5242d500eb47199db14cab354c46ddf76daac301ade8c2',NULL),(3,'surajkmr012','surajkmr012@gmail.com','[google-auth]','Suraj','Kumar','https://lh3.googleusercontent.com/a/ACg8ocL-Nk5VJD6XLk__Q4ak7xr2KulAvFaZs8rHDLI5HlTb7GKzIzk=s96-c','user',1,'active','2025-06-29 07:51:53','2025-06-29 07:05:08','2025-06-29 07:05:08','$2b$12$SUK1pFB8gwTBDe25kCFQAe3IIlSkFXs0gxekGOOSlT3oNNY0BlbiK','2025-07-06 07:51:53','2f74e7c453f08930287002d3d8ac9eca326aec326d4f437eda421bcd2c321c39','107511336443219401801'),(5,'geekysuraj','geekysuraj@gmail.com','[google-auth]','Geeky','Suraj','https://lh3.googleusercontent.com/a/ACg8ocLpy5AqluZqU2YQxD33CZ2SbQkXAcnGE_uq3KGv98YvK8V1eg=s96-c','user',1,'active','2025-10-30 18:40:19','2025-06-29 08:02:22','2025-06-29 08:02:22','$2b$12$KygAWkqNG2BlKDAwTdDiOOZfOG3R2.37nPox8Nmi1jbgfA6brepa6','2025-11-06 18:40:19','53529ecdf5ffdf80aea8248312c59411a3ebadfbb7141f934925bc9abb5f42b0','109187952349970434098'),(7,'mail4suraj11','mail4suraj11@gmail.com','[google-auth]','Suraj','Kumar','https://lh3.googleusercontent.com/a/ACg8ocKmTUPe5_395GEhAVGyDobCejDSqIYmL4c7u-1rrbfW7uV7rg=s96-c','user',1,'active','2025-06-29 08:11:40','2025-06-29 08:10:22','2025-06-29 08:10:22','$2b$12$XDHHN3gAqUKE1cQ1tRXrtexT5bV8zgJrSmTsZBxKeeXZFo6mYmWGC','2025-07-06 08:11:40','d276707e8a5b44885d8cf3e7ae11ea44bf90e740c16fb62b16bd7ede5e7ae809','100899370517137603313'),(8,'testuser1','testuser1@gmail.com','$2b$10$3QVdL6M5I9/QGN4ZbwkgieWws/7KYsMg/ZfCZ1rhfhFCKIxHWa7y.','test1','check1','','user',0,'active',NULL,'2025-06-29 11:57:51','2025-06-29 11:57:51',NULL,NULL,NULL,NULL),(9,'mail2suraj91','mail2suraj91@gmail.com','[google-auth]','Suraj','Kumar','https://lh3.googleusercontent.com/a/ACg8ocIwfqNnOrwbsHHjnZIbsPxv4yXDtqR20cgjrNTVyRXH2zV_9w=s96-c','user',1,'active','2025-10-30 18:36:13','2025-10-30 18:30:35','2025-10-30 18:30:35','$2b$12$N6o.IEtP8pO8LzDJXguYweMZOI6Jkit9uw4HG/IUKo2PYxa0408eG','2025-11-06 18:36:13','aaae2ddaabdb92dd2331a4f33f9972506478b2a4f4d68d92ef0f7ad62132b88c','118334862493892536785'),(10,'skumar','skumar@dxlg.com','[google-auth]','Suraj Kumar','Kumar','https://lh3.googleusercontent.com/a/ACg8ocJI0G-x4d6xgf55iFq_5-Yycu-04BzPjbAAS2Hn_4EC9DvFmg=s96-c','user',1,'active','2025-10-30 18:39:34','2025-10-30 18:38:44','2025-10-30 18:38:44','$2b$12$.U.WsfBCPZ3Qlt8MR/dxJOlC7CBtw003HNWYoc/yGARw27BklKzhO','2025-11-06 18:39:34','e66f4a3992da2e4b2fcb8cc11191f86e842a35e1679823cb9dcac0eab69ad15c','102206325043531489830');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-31 22:28:38
