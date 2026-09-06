Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Projects\Discord Claude Code"
WshShell.Run "node src\daemon.js", 0, False
