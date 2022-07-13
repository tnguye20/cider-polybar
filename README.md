# cider-polybar
A PolyBar custom script to interact with Cider - An open-source, community-oriented Apple Music

https://user-images.githubusercontent.com/9140437/178784336-2d6d4c94-8d21-4dad-8365-58a18dd41643.mp4

# Installation
Download the latest Release package to get the binary for the module. 
```bash
tar -xvzf <LOCATION>/cider-polybar.tar.gz
sudo cp cider-polybar /usr/local/bin
```
Inspect using the `-h` flag for all possible comamnd. 
``` 
Options:
      --version  Show version number                                   [boolean]
  -a, --action   Send informative actions to Cider
            [string] [choices: "playpause", "play", "pause", "next", "previous",
                                   "get-currentmediaitem", "volume", "autoplay"]
  -v, --volume   Increase/Decrease volume with this increment. Use with -a
                 volume                                                 [number]
  -h, --help     Show help                                             [boolean]
```

Insert this block inside of polybar config, tweak the interval to your liking. 
```
...
modules-left = bspwm i3 ciderbar
...
[module/ciderbar]
type = custom/script
exec = cider-polybar -a get-currentmediaitem
scroll-up = cider-polybar -a volume -v 0.01
scroll-down = cider-polybar -a volume -v -0.01
interval = 0.3
```

Optionally, if you use i3 like I do, add this to your i3 config to have keymappings
```
bindsym $mod+m [class="Cider"] scratchpad show
bindsym $mod+Ctrl+p exec cider-polybar -a playpause
bindsym $mod+Shift+v exec cider-polybar -a volume -v -0.02
bindsym $mod+Ctrl+v exec  cider-polybar -a volume -v 0.02
bindsym $mod+n exec cider-polybar -a next
bindsym $mod+Ctrl+ n exec cider-polybar -a previous
```

