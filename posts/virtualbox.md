---
title: "Virtualbox"
date: 2021-08-18T22:13:55+08:00
---

這篇文章是我用來記錄怎麼由 `virtualbox cli` 導入 `.ova` VirtualBox。
```bash
# import Virtual Machine from VirtualBox exported file.
vboxmanage import /mnt/ntfs/MCU-ASIS.ova
```

調整虛擬主機設定
```bash
# modify Windows Network bridge setting to linux
vboxmanage modifyvm MCU-ASIS \
  --nic1 bridged
  --nictype1 82540EM
  --bridgeadapter1 ens2p0
```

無畫面啟動
```bash
# Start headless Ubuntu virtual machine
vboxmanage startvm MCU-ASIS --type headless
# Stop Virtual Machine
vboxmanage controlvm MCU-ASIS poweroff
```

藉由區域網路取回虛擬主機的 ip。
```bash
# Get Virtual Machine ip
arp -a
# Alternative
ip neigh
```