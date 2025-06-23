-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: messengerapp
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `group_chat_members`
--

DROP TABLE IF EXISTS `group_chat_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_chat_members` (
  `chat_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('creator','admin','member') NOT NULL DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`chat_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `group_chat_members_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `group_chats` (`id`),
  CONSTRAINT `group_chat_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_chat_members`
--

LOCK TABLES `group_chat_members` WRITE;
/*!40000 ALTER TABLE `group_chat_members` DISABLE KEYS */;
INSERT INTO `group_chat_members` VALUES (1,3,'member','2025-05-16 19:02:19'),(1,4,'member','2025-05-16 19:02:19'),(1,5,'member','2025-05-16 19:02:19'),(1,6,'member','2025-05-16 19:02:19'),(2,3,'member','2025-06-22 20:14:37'),(2,4,'member','2025-06-22 20:14:37'),(2,5,'member','2025-06-22 20:14:37'),(2,6,'member','2025-06-22 20:14:37'),(3,3,'creator','2025-06-22 20:31:08'),(3,5,'member','2025-06-23 12:22:29'),(3,8,'member','2025-06-22 20:31:08'),(3,13,'member','2025-06-23 12:22:10'),(3,20,'member','2025-06-22 20:31:08'),(3,29,'member','2025-06-22 21:26:29'),(3,30,'member','2025-06-22 21:26:29'),(3,31,'member','2025-06-22 21:26:29'),(3,34,'member','2025-06-22 21:26:29');
/*!40000 ALTER TABLE `group_chat_members` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-23 17:38:59
