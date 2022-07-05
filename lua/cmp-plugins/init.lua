local repos = require("cmp-plugins.list")

function setup(_opts)
	local opts = {
		files = { ".*\\.lua" },
	}
	local source = {}

	if opts then
		opts = vim.tbl_deep_extend("force", opts, _opts)
	end

	source.new = function()
		local self = setmetatable({}, { __index = source })
		return self
	end

	function source:is_available()
		local filename = vim.fn.expand("%:p")
		for _, glob in ipairs(opts.files) do
			local re = vim.regex(glob)
			local s, e = re:match_str(filename)
			if s and e then
				return true
			end
		end
		return false
	end

	function source:get_trigger_characters()
		return { "/", "'", '"' }
	end

	function source:get_keyword_pattern()
		-- Add dot to existing keyword characters (\k).
		return [[\%(\k\|/|-\)\+]]
	end

	function string.starts(String, Start)
		return string.sub(String, 1, string.len(Start)) == Start
	end

	function source:complete(params, callback)
		local cur_line = params.context.cursor_line
		local _, _, incompleteUser = cur_line:find("[\"'](.+)[\"']")
		local _, _, user = cur_line:find("[\"'](.+)/.*[\"']")

		if user then
			local id = repos._map[string.lower(user)]
			local curRepos = repos.repos[id]
			local result = {}

			if curRepos then
				for _, value in pairs(curRepos) do
					table.insert(result, {
						label = value.name,
						detail = value.full_name .. "  " .. value.stargazers_count,
						documentation = {
							kind = "plaintext",
							value = value.description,
						},
						kind = 1,
						textEdit = {
							newText = value.name,
							range = {
								start = {
									line = params.context.cursor.row - 1,
									character = params.context.cursor.col - 1,
								},
								["end"] = {
									line = params.context.cursor.row - 1,
									character = params.context.cursor.col - 1,
								},
							},
						},
					})
				end

				callback({ items = result })
			end
		elseif incompleteUser then
			local users = {}
			for _, value in pairs(repos._map) do
				table.insert(users, { label = value, detail = "https://github.com/" .. value })
			end
			callback({ items = users, isIncomplete = table.getn(users) ~= 1 })
		else
			callback({ isIncomplete = true })
		end
	end

	function source:resolve(completion_item, callback)
		callback(completion_item)
	end

	function source:execute(completion_item, callback)
		callback(completion_item)
	end

	local cmp = require("cmp")

	cmp.register_source("plugins", source.new())
end

return { setup = setup }
