# Contabo VPS bringup runbook

Target: Contabo **Cloud VPS 20** · Debian 12 · Asia (Singapore) · 6 vCPU / 12 GB RAM / 200 GB SSD.

Sequential steps. Each phase is independently verifiable. Copy commands as-is unless a placeholder is in `<brackets>`.

---

## Phase 0 — Receive credentials

1. Wait for the Contabo provisioning email (usually 10–30 min after order). It contains:
   - **IPv4 address**
   - **Initial root password**
2. (Recommended) In Contabo Control Panel → your VPS → **Secure Shell** tab → paste your SSH public key so subsequent logins don't need the password.

---

## Phase 1 — First SSH + hardening

From Git Bash / PowerShell on your Windows box:

```bash
ssh root@<IP>
# paste the root password from the email
```

Change the root password immediately:
```bash
passwd
```

Update + install baseline tools:
```bash
apt update && apt upgrade -y
apt install -y curl wget gnupg sudo ufw fail2ban restic git jq ca-certificates
```

Create the unprivileged `mc` user (panel + Paper run as this user):
```bash
adduser mc              # pick a password
usermod -aG sudo mc
mkdir -p /home/mc/.ssh
# if you uploaded your key to root during order:
cp -a ~/.ssh/authorized_keys /home/mc/.ssh/ 2>/dev/null || true
chown -R mc:mc /home/mc/.ssh
chmod 700 /home/mc/.ssh
```

Harden SSH — disable root + password auth (only after confirming your key works for `mc`):
```bash
# Test first in a second terminal: ssh mc@<IP>
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

Firewall:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 25565/tcp        # Java Minecraft (lazymc)
ufw allow 19132/udp        # Bedrock Minecraft (Geyser)
ufw --force enable
```

**Verify Phase 1:** `ssh mc@<IP>` works, root SSH is blocked, `sudo ufw status` shows the rules above.

---

## Phase 2 — Java 21 + Caddy + Node 20

Java 21 (Temurin):
```bash
sudo apt install -y apt-transport-https
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /usr/share/keyrings/adoptium.gpg
echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-21-jre
java -version           # should print "21"
```

Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Node 20 (for the Next.js panel):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
node --version          # should print "v20.x"
```

---

## Phase 3 — Directory layout

```bash
sudo mkdir -p /srv/mc/demo
sudo chown -R mc:mc /srv/mc
sudo mkdir -p /opt/panel /opt/lazymc
sudo chown -R mc:mc /opt/panel /opt/lazymc
```

---

## Phase 4 — Paper + Geyser + Floodgate

As the `mc` user:
```bash
sudo -iu mc
cd /srv/mc/demo

# Latest Paper 1.21.4 build
BUILD=$(curl -s https://api.papermc.io/v2/projects/paper/versions/1.21.4 | jq -r '.builds[-1]')
wget "https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/${BUILD}/downloads/paper-1.21.4-${BUILD}.jar" -O server.jar

# First run (will fail on EULA)
java -Xmx3G -jar server.jar nogui || true
echo "eula=true" > eula.txt

# Geyser + Floodgate plugins
mkdir -p plugins
cd plugins
wget "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot" -O Geyser-Spigot.jar
wget "https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot" -O floodgate-spigot.jar
cd ..

# Second run — lets configs generate. Type `stop` in the console after it says "Done (Xs)!"
java -Xmx3G -jar server.jar nogui
```

Edit `/srv/mc/demo/server.properties`:
```ini
online-mode=false
enforce-secure-profile=false
server-port=25566
enable-rcon=true
rcon.port=25575
rcon.password=<GENERATE A 32-CHAR RANDOM STRING — write it down>
motd=A cross-play cracked server
max-players=20
view-distance=10
difficulty=normal
```

Generate a strong RCON password:
```bash
openssl rand -hex 16
```

---

## Phase 5 — lazymc (Java wake-on-join)

```bash
cd /opt/lazymc
# Grab the latest Linux x86_64 build
URL=$(curl -s https://api.github.com/repos/timvisee/lazymc/releases/latest | jq -r '.assets[] | select(.name | test("x86_64.*linux")) | .browser_download_url' | head -1)
wget "$URL" -O lazymc
chmod +x lazymc

# Generate per-server config
./lazymc config generate
mv lazymc.toml lazymc-demo.toml
```

Edit `/opt/lazymc/lazymc-demo.toml` — at minimum:
```toml
[public]
address = "0.0.0.0:25565"
version = "1.21.4"
protocol = 767

[server]
address = "127.0.0.1:25566"
directory = "/srv/mc/demo"
command = "java -Xmx3G -jar server.jar nogui"

[time]
sleep_after = 600          # seconds idle before stop
minimum_online_time = 60

[motd]
sleeping = "⏻ Click to wake — ~30s"
starting = "⚙ Starting…"
stopping = "Stopping…"

[lockout]
# optional

[rcon]
enabled = true
port = 25575
password = "<SAME AS server.properties>"
```

---

## Phase 6 — systemd units

`/etc/systemd/system/paper@.service`:
```ini
[Unit]
Description=Paper Minecraft server (%i)
After=network.target

[Service]
Type=simple
User=mc
Group=mc
WorkingDirectory=/srv/mc/%i
ExecStart=/usr/bin/java -Xmx3G -jar server.jar nogui
Restart=no
StandardInput=null
KillSignal=SIGINT
TimeoutStopSec=90

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/lazymc@.service`:
```ini
[Unit]
Description=lazymc sleeper for %i
After=network.target

[Service]
Type=simple
User=mc
Group=mc
WorkingDirectory=/srv/mc/%i
ExecStart=/opt/lazymc/lazymc start --config /opt/lazymc/lazymc-%i.toml
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable lazymc (it owns port 25565; Paper itself is started on-demand by lazymc):
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lazymc@demo
sudo systemctl status lazymc@demo
```

**Verify Phase 6:** Connect Minecraft Java client to `<IP>:25565`. First attempt shows "Starting…" MOTD, disconnects. Wait ~30s, second attempt joins the world. After 10 min idle, `sudo systemctl status paper@demo` reports inactive.

---

## Phase 7 — Bedrock + cross-play verification

Geyser runs **inside Paper** (no separate systemd unit needed). Once Paper is awake, Bedrock port `19132/udp` is answered by the Geyser plugin.

From a phone/tablet Minecraft Bedrock client: Add server with address `<IP>`, port `19132`. First attempt may fail if Paper is cold — retry. Join alongside a Java player, confirm both see each other's chat and skins.

*(Optional polish later: write a ~30-line Go UDP sleeper `geyser-wake` so the first Bedrock attempt also triggers the wake. Defer to after panel deploy.)*

---

## Phase 8 — Panel sudoers (panel starts/stops systemd units)

The panel's `src/lib/systemd.ts` shells out to `systemctl`. Give the `mc` user NOPASSWD for those specific commands only:

`/etc/sudoers.d/mc-panel`:
```
mc ALL=(root) NOPASSWD: /bin/systemctl start paper@*, /bin/systemctl stop paper@*, /bin/systemctl restart paper@*, /bin/systemctl is-active paper@*
```

Then update `src/lib/systemd.ts` to prefix commands with `sudo` (one-line change — we'll do this when we deploy).

---

## Phase 9 — Deploy the Next.js panel

```bash
sudo -iu mc
cd /opt/panel
git clone <YOUR_GITHUB_REPO> .
```

Create `/opt/panel/.env`:
```bash
DATABASE_URL="file:/opt/panel/data/app.sqlite"
BETTER_AUTH_SECRET="<openssl rand -hex 32>"
BETTER_AUTH_URL="https://panel.<yourdomain>"
MC_MOCK_INFRA=false
MC_ROOT=/srv/mc
```

Build:
```bash
mkdir -p /opt/panel/data
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
npm run db:seed            # creates the first user — edit scripts/seed.ts with your email first
```

`/etc/systemd/system/panel.service`:
```ini
[Unit]
Description=mc-panel Next.js
After=network.target

[Service]
Type=simple
User=mc
Group=mc
WorkingDirectory=/opt/panel
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now panel
sudo systemctl status panel
```

---

## Phase 10 — Caddy reverse proxy + TLS

`/etc/caddy/Caddyfile` (with a real domain):
```
panel.<yourdomain>.com {
  reverse_proxy 127.0.0.1:3000
  encode zstd gzip
}
```

Or without a domain (plain HTTP on port 80, fine for friend-group use, no TLS):
```
:80 {
  reverse_proxy 127.0.0.1:3000
}
```

```bash
sudo systemctl reload caddy
```

If you're using a domain: point an A record `panel.<yourdomain>` → `<IP>` first. Caddy auto-provisions Let's Encrypt TLS on first hit.

---

## Phase 11 — Backups (restic → Backblaze B2)

1. Sign up at backblaze.com, create a private bucket (name it something like `mc-panel-backups-ph`).
2. Create an Application Key scoped to that bucket; copy the `keyID` + `applicationKey`.

```bash
sudo -iu mc
cat >> ~/.profile <<'EOF'
export B2_ACCOUNT_ID=<keyID>
export B2_ACCOUNT_KEY=<applicationKey>
export RESTIC_REPOSITORY=b2:<bucket-name>:/
export RESTIC_PASSWORD="<openssl rand -hex 32 — save this in your password manager!>"
EOF
source ~/.profile
restic init
```

Nightly systemd timer — `/etc/systemd/system/mc-backup.service`:
```ini
[Unit]
Description=mc-panel nightly world backup
[Service]
Type=oneshot
User=mc
EnvironmentFile=/home/mc/.profile
ExecStart=/usr/bin/restic backup /srv/mc/demo/world /srv/mc/demo/world_nether /srv/mc/demo/world_the_end
ExecStartPost=/usr/bin/restic forget --keep-daily 7 --keep-weekly 4 --prune
```

`/etc/systemd/system/mc-backup.timer`:
```ini
[Unit]
Description=Nightly mc-panel backup
[Timer]
OnCalendar=daily
Persistent=true
[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mc-backup.timer
```

---

## Final verification checklist

- [ ] `ssh mc@<IP>` works, root SSH blocked
- [ ] `sudo systemctl status lazymc@demo` → active (running)
- [ ] Java client connects to `<IP>:25565` → wakes Paper → joins
- [ ] Bedrock client connects to `<IP>:19132` → joins same world (may need retry first time)
- [ ] Panel loads on `http(s)://panel.<yourdomain>` (or `http://<IP>`) → login works
- [ ] Panel Dashboard shows real player count + status when server is up
- [ ] Panel Power tab can start/stop Paper via sudo/systemd
- [ ] After 10 min idle with no players, `paper@demo` stops automatically
- [ ] `sudo systemctl list-timers` shows `mc-backup.timer` scheduled
- [ ] `restic snapshots` shows at least one backup after the first night

---

## Common pitfalls

- **Port conflicts**: don't run `paper@demo` directly while `lazymc@demo` is active — lazymc owns 25565 and spawns Paper on 25566.
- **RCON password mismatch**: `server.properties`, `lazymc-demo.toml`, and the panel's `Server.rconPassword` column must all match.
- **Firewall**: if clients can't connect, double-check `sudo ufw status` includes 25565/tcp and 19132/udp.
- **ARM vs x86**: Cloud VPS 20 is x86_64, so all jars/binaries download normally. No ARM gotchas.
- **Time drift**: `sudo apt install -y systemd-timesyncd && sudo systemctl enable --now systemd-timesyncd` — auth tokens care about clock skew.
