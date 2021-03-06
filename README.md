# cmp-plugins
nvim-cmp source for Neovim plugins.


https://user-images.githubusercontent.com/11719845/174234402-90e120e7-a75e-46f3-8a32-afb8e1001c7e.mov


## Setup
### Instalation

By default, the source will be available on all lua files. It's suggested that you change it to the filenames (or path) where you install
your Neovim plugins (regular expressions also work).

```lua
use({
  "hrsh7th/nvim-cmp",
  requires = {
    {
      "KadoBOT/cmp-plugins",
      config = function()
        require("cmp-plugins").setup({
          files = { ".*\\.lua" }  -- default
          -- files = { "plugins.lua", "some_path/plugins/" } -- Recommended: use static filenames or partial paths
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
