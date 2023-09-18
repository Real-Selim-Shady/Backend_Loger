import User from "../models/User";
import { Response, Application, Request } from "express";
import { ValidationError, UniqueConstraintError } from "sequelize";
import {auth} from "../auth/auth";
import bcrypt from "bcrypt";

interface AuthenticatedRequest extends Request {
    user?: {
      userId: string; 
    };
}

/**
 * Defines the route for editing a user.
 */
const editUserRoute = (app: Application) => {
	/**
     * Express route for editing a user, using authentication token.
     */
	app.put("/api/editUser/:id", auth, async (req: AuthenticatedRequest, res: Response) => {

		const userIdFromToken = req.user?.userId;
		const idFromUserToDelete = parseInt(req.params.id);
    
		if (userIdFromToken === undefined) {
			const message = "L'utilisateur n'est pas autorisé à modifier ce compte.";
			return res.status(401).json({ message });
		}
    
		const parsedIntTokenId = parseInt(userIdFromToken);
    
		if (isNaN(parsedIntTokenId) || parsedIntTokenId !== idFromUserToDelete) {
			const message = "L'utilisateur n'est pas autorisé à modifier ce compte.";
			return res.status(401).json({ message });
		}
    
		try {
			const user = await User.findByPk(parsedIntTokenId);
    
			if (user === null) {
				const message = "L'utilisateur demandé n'existe plus.";
				return res.status(404).json({ message });
			}
    
			user.firstName = req.body.firstName;
			user.lastName = req.body.lastName;
			user.userName = req.body.userName;

			if (req.body.password) {
				// Vérifiez si le mot de passe en clair correspond au hachage stocké
				const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
				if (!isPasswordValid) {
					// Générez un nouveau hachage avec un nouveau sel
					const hashedPassword = await bcrypt.hash(req.body.password, 10);
					user.password = hashedPassword;
				}
			}
    
			await user.save();
    
			const message = `L'utilisateur ${user.userName} a bien été modifié.`;
			res.json({ message, data: user });
		} catch(error) {
			if (error instanceof ValidationError) {
				return res.status(400).json({ message: error.message, data: error });
			}
			if (error instanceof UniqueConstraintError) {
				return res.status(400).json({ message: error.message, data: error });
			}
    
			console.error("Erreur:", error);
			const message = "L'utilisateur n'a pas pu être modifié. Réessayez dans quelques instants.";
			res.status(500).json({ message, data: error });
		}
	});
};

export default editUserRoute;


