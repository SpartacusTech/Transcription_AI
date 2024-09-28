-- CreateTable
CREATE TABLE `Video` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,  -- Alterado para VARCHAR
    `name` TEXT NOT NULL,
    `path` TEXT NOT NULL,
    `transcription` TEXT,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE `Prompt` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,  -- Alterado para VARCHAR
    `title` TEXT NOT NULL,
    `template` TEXT NOT NULL
);

