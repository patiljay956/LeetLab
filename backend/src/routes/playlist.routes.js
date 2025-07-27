import { Router } from "express";

import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    // Import all the controller functions
    createPlaylist,
    getPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addProblemToPlaylist,
    removeProblemFromPlaylist,
    getProblemsInPlaylist,
    getPlaylistsByUser,
    getPlaylistsByProblem,
} from "../controllers/playlist.controller.js";

const router = Router();
// Playlist routes
router
    .route("/playlists")
    .post(verifyToken, createPlaylist)
    .get(verifyToken, getPlaylists);

router
    .route("/playlists/:id")
    .get(verifyToken, getPlaylistById)
    .put(verifyToken, updatePlaylist)
    .delete(verifyToken, deletePlaylist);

router
    .route("/playlists/:id/problems")
    .get(verifyToken, getProblemsInPlaylist)
    .post(verifyToken, addProblemToPlaylist);

router
    .route("/playlists/:id/problems/:problemId")
    .delete(verifyToken, removeProblemFromPlaylist);

router.route("/users/:userId/playlists").get(verifyToken, getPlaylistsByUser);

router
    .route("/problems/:problemId/playlists")
    .get(verifyToken, getPlaylistsByProblem);

export default router;
