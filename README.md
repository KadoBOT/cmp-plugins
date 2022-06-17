# cmp-plugins
nvim-cmp source for Neovim plugins.

## Setup
### Instalation

By default, the source will be available on all lua files. It's suggested to change it to the filenames where you install
your Neovim plugins. e.g.: `files = { "plugins.lua" }`

```lua
use({
  "hrsh7th/nvim-cmp",
  requires = {
    {
      "KadoBOT/cmp-plugins",
      config = function()
        require("cmp-plugins").setup({
          files = { "*.lua" }  -- default
        })
      end,
    },
  }
})
```

### Configuration
```lua
require('cmp').setup({
  sources = {
    { name = 'plugins' },
  },
})
```
