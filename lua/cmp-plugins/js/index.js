import { writeFile } from "node:fs/promises"
import { format } from 'lua-json'
import { readFileSync } from "node:fs";
import path from 'path'

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
// 03-10-22
const dates = ['created:2022-08-08..*']
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
		const buf = readFileSync(path.resolve("./js/list.json"))
		const list = JSON.parse(buf.toString('utf8'))
		const mergedMap = { ...list._map, ...fullList._map }
		const mergedRepos = { ...list.repos, ...fullList.repos }

		const orderedMap = Object.keys(mergedMap).sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1).reduce((obj, key) => {
			obj[key] = mergedMap[key]
			return obj
		}, {})

		const orderedRepos = Object.keys(mergedRepos).sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1).reduce((obj, key) => {
			obj[key] = mergedRepos[key]
			return obj
		}, {})

		const newList = { repos: orderedRepos, _map: orderedMap }

		writeFile("./js/list.json", JSON.stringify(newList, null, 4))
		writeFile("./list.lua", format(newList))
	}
}

run()
