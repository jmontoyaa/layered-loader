const knex = require('knex')
const { dbConfig } = require('./dbConfig.js')
const { UserRepository } = require('./repository.js')

async function seedWithData() {
  const knexInstance = knex({
    ...dbConfig,
    migrations: {
      directory: '../migrations',
    },
  })
  const repository = new UserRepository(knexInstance)

  const companyId = 1
  const name = 'name'

  await repository.createBulk([
    {
      companyId,
      name,
    },
  ])

  await knexInstance.destroy()
  console.log('Finished seeding')
}

seedWithData()
