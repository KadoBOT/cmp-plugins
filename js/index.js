import { writeFile } from "node:fs/promises"
import { format } from 'lua-json'

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const url = (page = 1, created) => {
	const base = new URL(`https://api.github.com/search/repositories`)
	base.searchParams.set('q', `topic:neovim ${created}`)
	base.searchParams.set('order', 'desc')
	base.searchParams.set('page', page)
	base.searchParams.set('per_page', 100)

	return base.toString()
}
const fullList = { _map: {}, repos: {} }
const dates = ['created:*..2018-01-01', 'created:2018-01-01..2019-01-01', 'created:2019-01-01..2020-01-01', 'created:2020-01-01..2021-01-01', 'created:2021-01-01..2021-06-01', 'created:2021-06-01..2022-01-01', 'created:2022-01-01..2022-06-01', 'created:2022-06-01..*']
let pages = 10

async function run() {
	try {
		for (const date of dates) {
			let sleepMs = 10000

			const getResults = async (page = 1) => {
				const curUrl = url(page, date)
				const resp = await fetch(curUrl)
				process.stdout.write(`${decodeURIComponent(curUrl)}, ${resp.status}, ${resp.statusText} `)

				if (resp.status === 403) {
					process.stdout.write(`sleep ${sleepMs}ms \n`)
					await sleep(sleepMs)
					sleepMs += 1000
					await getResults(page)
				}

				if (resp.status === 200) {
					const json = await resp.json()
					pages = json.total_count / 100
					process.stdout.write(`${json.total_count} \n`)

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
							const ownerRepos = repo.owner.login in fullList.repos ? fullList.repos[repo.owner.login] : []
							fullList.repos[repo.owner.login] = [...ownerRepos, item]
						})
					}

					if (page < pages) {
						await getResults(page + 1)
					}
				}
			}

			await getResults()
		}
	} catch (e) {
		console.error(e)
	} finally {
		const orderedMap = Object.keys(fullList._map).sort().reduce((obj, key) => {
			obj[key] = fullList._map[key]
			return obj
		}, {})

		const orderedRepos = Object.keys(fullList.repos).sort().reduce((obj, key) => {
			obj[key] = fullList.repos[key]
			return obj
		}, {})

		writeFile("list.lua", format({ repos: orderedRepos, _map: orderedMap }))
	}
}

run()
