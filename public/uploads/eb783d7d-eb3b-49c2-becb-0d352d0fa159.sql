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
-- Table structure for table `message_files`
--

DROP TABLE IF EXISTS `message_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_size` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `message_id` (`message_id`),
  CONSTRAINT `message_files_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_files`
--

LOCK TABLES `message_files` WRITE;
/*!40000 ALTER TABLE `message_files` DISABLE KEYS */;
INSERT INTO `message_files` VALUES (1,432,'/uploads/ab663c9c-4a42-4296-b56e-8d59fb632553.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-20 02:11:19'),(2,433,'/uploads/0f289fe5-9535-43b0-832b-c7a69699016b.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-20 02:11:38'),(3,433,'/uploads/57c4c281-bf93-482a-bd7b-013cb39a766b.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-20 02:11:38'),(4,433,'/uploads/9957fa2f-d1f4-40f0-8eb1-02cabf51a80a.png','Снимок экрана 2025-03-23 200405.png','image/png',48815,'2025-06-20 02:11:38'),(5,433,'/uploads/abaa7b34-a241-4ebf-85bc-aa3e6d415ccd.png','Снимок экрана 2025-03-23 200405.png','image/png',48815,'2025-06-20 02:11:38'),(6,433,'/uploads/f308dc0d-2439-440e-b918-9e374d75de2c.png','Снимок экрана 2025-03-23 231645.png','image/png',3599723,'2025-06-20 02:11:38'),(7,433,'/uploads/455af510-0bde-4870-a255-a9116d77535e.png','Снимок экрана 2025-03-23 231645.png','image/png',3599723,'2025-06-20 02:11:38'),(8,433,'/uploads/e208ca1d-7977-417a-ba6a-8569df3fbd6f.png','Снимок экрана 2025-03-24 201017.png','image/png',149254,'2025-06-20 02:11:38'),(9,434,'/uploads/7532d951-cdfb-44b7-a31f-4f7839f626b0.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-20 02:11:55'),(10,434,'/uploads/017d3c24-7faf-4737-832a-d9c2714f49a1.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-20 02:11:55'),(11,434,'/uploads/096977a9-8ec0-4538-b7f5-f8ba47ce40b3.png','Снимок экрана 2025-03-23 200405.png','image/png',48815,'2025-06-20 02:11:55'),(12,434,'/uploads/60b3d2c3-94de-47a5-a023-0545697f850a.png','Снимок экрана 2025-03-23 200405.png','image/png',48815,'2025-06-20 02:11:55'),(13,434,'/uploads/acb49336-9804-43cd-af9e-c89ffd42e164.png','Снимок экрана 2025-03-23 231645.png','image/png',3599723,'2025-06-20 02:11:55'),(14,434,'/uploads/bb99b7be-b7e0-4b2f-8064-33787fe55f71.png','Снимок экрана 2025-03-23 231645.png','image/png',3599723,'2025-06-20 02:11:55'),(15,434,'/uploads/3e64aad3-8594-4d15-a04e-1a899bbefeef.png','Снимок экрана 2025-03-24 201017.png','image/png',149254,'2025-06-20 02:11:55'),(16,434,'/uploads/1f4ae9dc-0aee-4a33-a843-9d9cec9245b6.png','Снимок экрана 2025-03-24 201017.png','image/png',149254,'2025-06-20 02:11:55'),(17,434,'/uploads/e84bc506-4ab1-4abc-be3e-ab2493f7e636.png','Снимок экрана 2025-03-25 220820.png','image/png',37392,'2025-06-20 02:11:55'),(18,434,'/uploads/61da56f6-bc9e-4f09-b8cb-c4a9d5c92e85.png','Снимок экрана 2025-03-25 220820.png','image/png',37392,'2025-06-20 02:11:55'),(19,435,'/uploads/4e561d35-c83c-4423-b246-d2207a18e9ff.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-20 02:14:09'),(20,436,'/uploads/98ff8ab0-c0ea-4b10-b4d6-30381f1f898d.mp3','темный принц- волк с уолл стрит.mp3','audio/mpeg',1092848,'2025-06-20 02:14:28'),(21,437,'/uploads/f30c094d-7572-4278-ba96-f386d5fd7236.docx','Диплом(редачь именно это файл) (1).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',2419415,'2025-06-20 02:14:51'),(22,479,'/uploads/5651f0bc-c004-4fe7-905f-55faeb364bd4.pdf','Диаграмма без названия.drawio (1).pdf','application/pdf',42032,'2025-06-20 02:38:56'),(23,479,'/uploads/1b1ca066-0e14-4f1a-bbef-b0dadd3aacce.pdf','Диаграмма без названия.drawio.pdf','application/pdf',41162,'2025-06-20 02:38:56'),(24,487,'/uploads/bbd47323-cfe8-4a87-a629-8605176cb16d.docx','Диплом(редачь именно это файл) (1).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',2419415,'2025-06-20 06:31:33'),(25,490,'/uploads/725e439a-202b-453c-99cb-8d013c83b629.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-20 06:49:07'),(26,490,'/uploads/f004e63c-8dfc-4a93-9f7b-e61b54dc08b3.png','Снимок экрана 2025-03-23 200405.png','image/png',48815,'2025-06-20 06:49:07'),(27,490,'/uploads/eb9b7c9d-f729-47d6-8e15-5cdc803e88f8.png','Снимок экрана 2025-03-24 201017.png','image/png',149254,'2025-06-20 06:49:07'),(28,494,'/uploads/6fc0a654-b705-4368-9808-d244c1580761.docx','Диплом(редачь именно это файл) (1).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',2296081,'2025-06-20 10:38:52'),(29,494,'/uploads/ac3c081d-2a88-4f3f-b074-a6529e68e023.docx','Диплом_Наумов2 (1).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',81014,'2025-06-20 10:38:52'),(30,494,'/uploads/1a1c9308-abb2-4fdf-a693-7349d4a2afc1.docx','Диплом(редачь именно это файл).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',2419415,'2025-06-20 10:38:52'),(31,494,'/uploads/398ae986-1dd0-47f1-bd7d-eeda7e0fde2e.pdf','Диаграмма без названия.drawio (1).pdf','application/pdf',42032,'2025-06-20 10:38:52'),(32,494,'/uploads/1e1cc2fc-6abc-4e78-bd4f-db6cca035227.pdf','Диаграмма без названия.drawio.pdf','application/pdf',41162,'2025-06-20 10:38:52'),(33,494,'/uploads/ade4afee-1ce8-4ce5-8de4-43003cb5acfc.zip','aaa-main.zip','application/x-zip-compressed',11035670,'2025-06-20 10:38:52'),(34,507,'/uploads/0884a750-5b85-45d7-b80a-1a3e2d78513a.docx','6fc0a654-b705-4368-9808-d244c1580761.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',2296081,'2025-06-22 11:00:29'),(35,507,'/uploads/ebb34709-9253-4ab0-8651-b76234617efb.docx','Диплом(редачь именно это файл) (1).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',2296081,'2025-06-22 11:00:29'),(36,507,'/uploads/60b78f75-d6b9-499a-9b42-b820c707273b.docx','Диплом_Наумов2 (1).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',81014,'2025-06-22 11:00:29'),(37,592,'/uploads/b7aab7b5-9db7-4b9d-a610-6865eb1afd8d.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-22 23:08:55'),(38,593,'/uploads/e6cd5295-ac03-44bd-8b32-e211596460b2.png','Снимок экрана 2025-03-25 221553.png','image/png',27674,'2025-06-22 23:09:07'),(39,594,'/uploads/b5743c4b-06d8-4d22-a5d2-da0b0867de32.docx','0884a750-5b85-45d7-b80a-1a3e2d78513a.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',2296081,'2025-06-22 23:09:21'),(40,595,'/uploads/5e7dc028-1576-422a-8444-c7844625d753.png','Снимок экрана 2025-04-13 004638.png','image/png',182288,'2025-06-22 23:46:46'),(41,596,'/uploads/4601cae3-4f62-4266-97de-38288dd13b7c.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-22 23:47:07'),(42,596,'/uploads/e30aea12-e712-462d-a7df-244db7f2ef3a.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-22 23:47:07'),(43,596,'/uploads/350297e3-eb81-4f07-b26e-3768daa77d07.png','Снимок экрана 2025-03-23 200405.png','image/png',48815,'2025-06-22 23:47:07'),(44,596,'/uploads/4a89203f-eb01-4ec9-813d-5680cd43d4b3.png','Снимок экрана 2025-03-23 200405.png','image/png',48815,'2025-06-22 23:47:07'),(45,596,'/uploads/5fda810a-83dc-4253-8a0a-47f1d9e99e57.png','Снимок экрана 2025-03-23 231645.png','image/png',3599723,'2025-06-22 23:47:07'),(46,596,'/uploads/6727c8ec-18f5-4735-aa65-944f6c7de2ad.png','Снимок экрана 2025-03-23 231645.png','image/png',3599723,'2025-06-22 23:47:07'),(47,596,'/uploads/531e447b-53b5-4e6f-b846-43963265038a.png','Снимок экрана 2025-03-24 201017.png','image/png',149254,'2025-06-22 23:47:07'),(48,597,'/uploads/4bc43892-8750-4f8e-b847-0a0e731cd780.png','Снимок экрана 2025-03-23 153401.png','image/png',5161,'2025-06-23 12:16:30');
/*!40000 ALTER TABLE `message_files` ENABLE KEYS */;
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
