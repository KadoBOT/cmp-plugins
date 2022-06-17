import { writeFile } from "node:fs/promises"
import { format } from 'lua-json'

const url = (page = 1) => `https://api.github.com/search/repositories?q=topic:neovim&sort=stars&order=desc&per_page=100&page=${page}`
const fullList = { _map: {} }
let pages = Infinity

async function run(page = 1) {
	try {
		const resp = await fetch(url(page))
		const json = await resp.json()
		pages = json.total_count / 100

		if ('items' in json) {
			json.items.forEach(repo => {
				const item = {
					name: repo.name,
					full_name: repo.full_name,
					url: repo.html_url,
					description: repo.description,
					stargazers_count: repo.stargazers_count,
				}

				fullList._map[repo.owner.login.toLowerCase()] = repo.owner.login
				const ownerRepos = repo.owner.login in fullList ? fullList[repo.owner.login] : []
				fullList[repo.owner.login] = [ ...ownerRepos, item]
			})

			if (page < pages) {
				run(page + 1)
			}
		}
	} catch (e) {
		console.error(e)
	} finally {
		writeFile("list.lua", format(fullList))
	}
}

run()
