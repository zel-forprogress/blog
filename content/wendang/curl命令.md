---
title: "curl命令"
date: 2026-05-02
feishu_node_token: "VSotwN800itxiikaEvhceroynpb"
feishu_edit_time: "1777693884"
---

# curl命令

curl命令
curl 是一个非常强大的命令行工具，它用于与服务器交换数据。通过 curl，你可以向服务器发送 HTTP 请求，下载或上传文件，甚至与 API 进行交互。它支持多种协议，如 HTTP、HTTPS、FTP、FTPS、SFTP、SMTP 等等。
基本语法：

curl [选项] [URL]
常见用途：
获取网页内容:

curl http://example.com
这条命令将会获取 example.com 网站的 HTML 内容并显示在终端上。
下载文件:

curl -O https://example.com/file.zip
使用 -O 选项可以将文件下载到本地并保留原文件名。
发送 POST 请求:

curl -X POST -d "username=user&password=pass" http://example.com/login
这条命令向 example.com/login 发送一个 POST 请求，数据为 username=user&password=pass。
上传文件:

curl -X POST -F "file=@/path/to/file" http://example.com/upload
使用 -F 选项可以发送文件，@ 后跟文件路径表示上传的文件。
获取响应头:

curl -I http://example.com
-I 选项只获取响应的头部信息。
发送自定义请求头:

curl -H "Authorization: Bearer your_token" http://example.com/data
使用 -H 选项可以添加自定义的请求头，这里用于设置 Authorization 头。
跟随重定向:

curl -L http://example.com
-L 选项使得 curl 自动跟随服务器返回的重定向。
设置代理:

curl -x http://proxyserver:8080 http://example.com
-x 选项可以设置代理服务器，代理服务器地址为 proxyserver，端口为 8080。
保存响应到文件:

curl http://example.com -o output.html
-o 选项指定将响应内容保存到 output.html 文件中。
常用选项说明：
-X 或 --request：指定请求方法，如 GET、POST、PUT、DELETE 等。 
-d 或 --data：发送请求数据，通常用于 POST 请求。 
-H 或 --header：设置自定义请求头。 
-O：下载文件并保存为原始文件名。 
-L：自动跟随重定向。 
-I：仅获取响应头。 
-u 或 --user：设置用户名和密码（例如，-u user:password）。 
-F 或 --form：发送表单数据（用于文件上传）。 
curl 非常灵活，可以用来调试 API，测试服务器，甚至进行文件下载和上传，适用于开发、运维等多种场景。

