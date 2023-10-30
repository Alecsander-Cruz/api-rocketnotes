const { hash, compare } = require('bcryptjs');
const knex = require('../database/knex');
const AppError = require('../utils/AppError');

// const sqliteConnection = require('../database/sqlite');

class UsersController {
    /**
     * index - GET para listar vários registros.
     * show - GET para exibir um registro específico.
     * create - POST para criar um registro.
     * update - PUT para atualizar um registro.
     * delete - DELETE para remover um registro.
     **/

    async create(request, response) {
        const { name, email, password } = request.body;

        const checkUserExist = await knex('users')
            .select()
            .where('users.email', email)
            .first();

        if (checkUserExist) {
            throw new AppError('Este email já está em uso.');
        }

        const hashedPassword = await hash(password, 8);

        await knex('users').insert({
            name,
            email,
            password: hashedPassword
        });

        return response.status(201).json();
    }

    async update(request, response) {
        const { name, email, password, old_password } = request.body;

        const user_id = request.user.id;

        const [user] = await knex('users').select().where('users.id', user_id);

        if (!user) {
            throw new AppError('Usuário não encontrado!');
        }

        const [userWithUpdatedEmail] = await knex('users')
            .select()
            .where('users.email', email);

        if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
            throw new AppError('Este email já está sendo usado!');
        }

        user.name = name ?? user.name;
        user.email = email ?? user.email;

        if (password && !old_password) {
            throw new AppError(
                'Você precisa informar a senha antiga para mudar a senha!'
            );
        }

        if (password && old_password) {
            const checkOldPassword = await compare(old_password, user.password);
            if (!checkOldPassword) {
                throw new AppError('A senha antiga não está correta!');
            }

            user.password = await hash(password, 8);
        }

        await knex('users').where('users.id', user_id).update({
            name: user.name,
            email: user.email,
            password: user.password,
            updated_at: knex.fn.now()
        });

        return response.json();
    }
}

// async create(request, response) {
//     const { name, email, password } = request.body;

//     const database = await sqliteConnection();

//     const checkUserExist = await database.get(
//         'select * from users where email = (?)',
//         [email]
//     );

//     if (checkUserExist) {
//         throw new AppError('Este email já está em uso.');
//     }

//     const hashedPassword = await hash(password, 8);

//     await database.run(
//         'insert into users (name, email, password) values (?,?,?)',
//         [name, email, hashedPassword]
//     );

//     return response.status(201).json();
// }

// async update(request, response) {
//     const { name, email, password, old_password } = request.body;

//     const { id } = request.params;

//     const database = await sqliteConnection();
//     const user = await database.get('select * from users where id = (?)', [
//         id
//     ]);

//     if (!user) {
//         throw new AppError('Usuário não encontrado!');
//     }

//     const userWithUpdatedEmail = await database.get(
//         'select * from users where email = (?)',
//         [email]
//     );

//     if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
//         throw new AppError('Este email já está sendo usado!');
//     }

//     user.name = name ?? user.name;
//     user.email = email ?? user.email;

//     if (password && !old_password) {
//         throw new AppError(
//             'Você precisa informar a senha antiga para mudar a senha!'
//         );
//     }

//     if (password && old_password) {
//         const checkOldPassword = await compare(old_password, user.password);
//         if (!checkOldPassword) {
//             throw new AppError('A senha antiga não está correta!');
//         }

//         user.password = await hash(password, 8);
//     }

//     await database.run(
//         `
//         update users set
//         name = ?,
//         email = ?,
//         password = ?,
//         updated_at = datetime('now')
//         where id = ?
//     `,
//         [user.name, user.email, user.password, id]
//     );

//     return response.json();
// }

module.exports = UsersController;
