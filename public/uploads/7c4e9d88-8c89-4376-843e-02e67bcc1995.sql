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
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `friend_id` int NOT NULL,
  `status` enum('pending','accepted') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_friendship` (`user_id`,`friend_id`),
  KEY `friend_id` (`friend_id`),
  CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
INSERT INTO `friends` VALUES (1,3,4,'accepted','2025-05-02 12:10:49'),(2,3,5,'accepted','2025-05-02 12:10:49'),(3,3,6,'accepted','2025-05-02 12:10:49'),(4,3,7,'accepted','2025-05-02 12:10:49'),(5,3,8,'accepted','2025-05-02 12:10:49'),(6,3,9,'accepted','2025-05-02 12:10:49'),(7,10,3,'accepted','2025-05-02 13:19:18'),(8,3,11,'accepted','2025-05-15 15:05:27'),(9,3,12,'accepted','2025-05-15 15:05:27'),(10,3,13,'accepted','2025-05-15 15:05:27'),(11,3,14,'accepted','2025-05-15 15:05:27'),(12,3,15,'accepted','2025-05-15 15:05:27'),(13,3,16,'accepted','2025-05-15 15:05:27'),(14,3,17,'accepted','2025-05-15 15:05:27'),(15,3,18,'accepted','2025-05-15 15:05:27'),(16,3,19,'accepted','2025-05-15 15:05:27'),(17,3,20,'accepted','2025-05-15 15:05:27'),(18,3,21,'accepted','2025-05-15 15:05:27'),(19,3,22,'accepted','2025-05-15 15:05:27'),(20,3,23,'accepted','2025-05-15 15:05:27'),(21,3,24,'accepted','2025-05-15 15:05:27'),(22,3,25,'accepted','2025-05-15 15:05:27'),(23,3,26,'accepted','2025-05-15 15:05:27'),(24,3,27,'accepted','2025-05-15 15:05:27'),(25,3,28,'accepted','2025-05-15 15:05:27'),(26,3,29,'accepted','2025-05-15 15:05:27'),(27,3,30,'accepted','2025-05-15 15:05:27'),(28,3,31,'accepted','2025-05-15 15:05:27'),(29,8,7,'pending','2025-05-15 19:28:18'),(30,7,8,'pending','2025-05-15 19:28:18'),(31,34,3,'accepted','2025-06-22 14:26:47'),(33,34,1,'pending','2025-06-22 14:28:07'),(34,34,9,'pending','2025-06-22 14:29:59'),(35,34,8,'pending','2025-06-22 14:31:11'),(36,8,4,'accepted','2025-06-22 15:31:57'),(37,4,6,'accepted','2025-06-22 15:49:29'),(42,4,3,'accepted','2025-05-02 12:10:49'),(43,5,3,'accepted','2025-05-02 12:10:49'),(44,6,3,'accepted','2025-05-02 12:10:49'),(45,7,3,'accepted','2025-05-02 12:10:49'),(46,8,3,'accepted','2025-05-02 12:10:49'),(47,9,3,'accepted','2025-05-02 12:10:49'),(48,3,10,'accepted','2025-05-02 13:19:18'),(49,11,3,'accepted','2025-05-15 15:05:27'),(50,12,3,'accepted','2025-05-15 15:05:27'),(51,13,3,'accepted','2025-05-15 15:05:27'),(52,14,3,'accepted','2025-05-15 15:05:27'),(53,15,3,'accepted','2025-05-15 15:05:27'),(54,16,3,'accepted','2025-05-15 15:05:27'),(55,17,3,'accepted','2025-05-15 15:05:27'),(56,18,3,'accepted','2025-05-15 15:05:27'),(57,19,3,'accepted','2025-05-15 15:05:27'),(58,20,3,'accepted','2025-05-15 15:05:27'),(59,21,3,'accepted','2025-05-15 15:05:27'),(60,22,3,'accepted','2025-05-15 15:05:27'),(61,23,3,'accepted','2025-05-15 15:05:27'),(62,24,3,'accepted','2025-05-15 15:05:27'),(63,25,3,'accepted','2025-05-15 15:05:27'),(64,26,3,'accepted','2025-05-15 15:05:27'),(65,27,3,'accepted','2025-05-15 15:05:27'),(66,28,3,'accepted','2025-05-15 15:05:27'),(67,29,3,'accepted','2025-05-15 15:05:27'),(68,30,3,'accepted','2025-05-15 15:05:27'),(69,31,3,'accepted','2025-05-15 15:05:27'),(70,6,4,'accepted','2025-06-22 15:49:29'),(73,6,15,'pending','2025-06-22 16:21:00'),(74,6,13,'pending','2025-06-22 16:21:00'),(75,6,11,'pending','2025-06-22 16:21:01'),(76,6,10,'pending','2025-06-22 16:21:02'),(77,6,9,'pending','2025-06-22 16:21:03'),(78,6,5,'pending','2025-06-22 16:21:06'),(79,4,8,'accepted','2025-06-22 17:10:30');
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-23 17:38:58
