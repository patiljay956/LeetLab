import { Router } from "express";

import { checkAdmin, verifyToken } from "../middlewares/auth.middleware.js";
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
    .post(verifyToken, checkAdmin, createPlaylist)
    .get(verifyToken, getPlaylists);

router
    .route("/playlists/:id")
    .get(verifyToken, getPlaylistById)
    .put(verifyToken, checkAdmin, updatePlaylist)
    .delete(verifyToken, checkAdmin, deletePlaylist);

router
    .route("/playlists/:id/problems")
    .get(verifyToken, getProblemsInPlaylist)
    .post(verifyToken, checkAdmin, addProblemToPlaylist);

router
    .route("/playlists/:id/problems/:problemId")
    .delete(verifyToken, checkAdmin, removeProblemFromPlaylist);

router.route("/users/:userId/playlists").get(verifyToken, getPlaylistsByUser);

router
    .route("/problems/:problemId/playlists")
    .get(verifyToken, getPlaylistsByProblem);

export default router;
