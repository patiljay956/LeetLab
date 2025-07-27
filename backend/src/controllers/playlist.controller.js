import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";

`

model Playlist {
  id          String               @id @default(uuid())
  name        String
  description String?
  userId      String
  problems    ProblemsInPlaylist[]
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
  user        User                 @relation(fields: [userId], references: [id], onDelete: Cascade)

  Problem Problem[]

  @@unique([userId, name]) // Ensure a user can only have one playlist with a specific name
  @@index([userId]) // Index for faster lookups
  @@index([name]) // Index for faster lookups by name
}

model ProblemsInPlaylist {
  id         String   @id @default(uuid())
  playlistId String
  problemId  String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  playlist Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  problem  Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([playlistId, problemId]) // Ensure a problem can only be in a playlist once
  @@index([playlistId, problemId]) // Index for faster lookups
}

`;

export const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check if a playlist with the same name already exists for the user
    const existingPlaylist = await db.playlist.findUnique({
        where: { userId_name: { userId, name } },
    });

    if (existingPlaylist) {
        throw new ApiError(400, "A playlist with this name already exists.");
    }

    const newPlaylist = await db.playlist.create({
        data: {
            name,
            description,
            userId,
        },
    });

    res.status(201).json(
        new ApiResponse("Playlist created successfully", newPlaylist),
    );
});
export const addProblemToPlaylist = asyncHandler(async (req, res) => {
    const { id: playlistId } = req.params;
    const { problemId } = req.body;

    // Check if the problem is already in the playlist
    const existingProblem = await db.problemsInPlaylist.findUnique({
        where: { playlistId_problemId: { playlistId, problemId } },
    });

    if (existingProblem) {
        throw new ApiError(400, "This problem is already in the playlist.");
    }

    const newProblem = await db.problemsInPlaylist.create({
        data: {
            playlistId,
            problemId,
        },
    });

    res.status(201).json(
        new ApiResponse("Problem added to playlist successfully", newProblem),
    );
});
export const getPlaylists = asyncHandler(async (req, res) => {
    const playlists = await db.playlist.findMany({
        include: {
            user: true,
            Problem: true,
        },
    });

    res.status(200).json(
        new ApiResponse("Playlists retrieved successfully", playlists),
    );
});
export const getPlaylistById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const playlist = await db.playlist.findUnique({
        where: { id },
        include: {
            user: true,
            Problem: true,
        },
    });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    res.status(200).json(
        new ApiResponse("Playlist retrieved successfully", playlist),
    );
});
export const updatePlaylist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedPlaylist = await db.playlist.update({
        where: { id },
        data: {
            name,
            description,
        },
    });

    res.status(200).json(
        new ApiResponse("Playlist updated successfully", updatedPlaylist),
    );
});
export const deletePlaylist = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedPlaylist = await db.playlist.delete({
        where: { id },
    });

    res.status(200).json(
        new ApiResponse("Playlist deleted successfully", deletedPlaylist),
    );
});
export const removeProblemFromPlaylist = asyncHandler(async (req, res) => {
    const { id: playlistId, problemId } = req.params;

    const deletedProblem = await db.problemsInPlaylist.delete({
        where: { playlistId_problemId: { playlistId, problemId } },
    });

    res.status(200).json(
        new ApiResponse(
            "Problem removed from playlist successfully",
            deletedProblem,
        ),
    );
});
export const getProblemsInPlaylist = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const problems = await db.problemsInPlaylist.findMany({
        where: { playlistId: id },
        include: {
            problem: true,
        },
    });

    if (!problems.length) {
        throw new ApiError(404, "No problems found in this playlist.");
    }

    res.status(200).json(
        new ApiResponse(
            "Problems in playlist retrieved successfully",
            problems,
        ),
    );
});
export const getPlaylistsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const playlists = await db.playlist.findMany({
        where: { userId },
        include: {
            user: true,
            Problem: true,
        },
    });

    if (!playlists.length) {
        throw new ApiError(404, "No playlists found for this user.");
    }

    res.status(200).json(
        new ApiResponse("User's playlists retrieved successfully", playlists),
    );
});
export const getPlaylistsByProblem = asyncHandler(async (req, res) => {
    const { problemId } = req.params;

    const playlists = await db.problemsInPlaylist.findMany({
        where: { problemId },
        include: {
            playlist: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!playlists.length) {
        throw new ApiError(404, "No playlists found for this problem.");
    }

    res.status(200).json(
        new ApiResponse(
            "Playlists containing the problem retrieved successfully",
            playlists,
        ),
    );
});
