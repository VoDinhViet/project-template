#!/bin/sh
# Tạo user chỉ đọc (`qlda_ro`) cho MySQL MCP. Chỉ chạy lần đầu, khi volume còn trống.
# Mật khẩu không được chứa dấu nháy đơn vì được ghép thẳng vào câu SQL.
set -eu

mariadb -uroot -p"${MARIADB_ROOT_PASSWORD}" <<SQL
CREATE USER 'qlda_ro'@'%' IDENTIFIED BY '${QLDA_RO_PASSWORD}';
GRANT SELECT ON \`${MARIADB_DATABASE}\`.* TO 'qlda_ro'@'%';
SQL
