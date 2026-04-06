#!/usr/bin/env python3.12
"""Pixel Art Sprite Generator for 2D RPG"""
from PIL import Image

def p(img, x, y, c):
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), c)

def r(img, x, y, w, h, c):
    for dy in range(h):
        for dx in range(w):
            p(img, x+dx, y+dy, c)

def circ(img, cx, cy, rad, c):
    for y in range(cy-rad, cy+rad+1):
        dy = y - cy
        if dy*dy > rad*rad:
            continue
        hw = int((rad*rad - dy*dy)**0.5)
        for x in range(cx-hw, cx+hw+1):
            p(img, x, y, c)

BLUE = (60,140,220); DBLUE = (30,80,160); LBLUE = (130,190,255)
WHITE = (255,255,255); SKIN = (255,210,180); HAIR = (50,40,35)
RED = (200,50,50); BLACK = (30,30,30); BROWN = (140,100,50); DBROWN = (90,60,30)
GREEN = (80,180,60); DGREEN = (50,120,40); LGREEN = (160,220,80)
GOB = (100,170,60); DGOB = (70,120,40)
PURP = (150,80,200); DPURP = (100,50,150)
EYE = (255,255,255); REDEYE = (200,60,60)
FBG = (60,130,50); FDARK = (40,90,30); FLIGHT = (100,180,70)
TGREEN = (50,120,40); TRUNK = (100,70,35); GRASS = (80,160,50)
STONE = (80,80,90); MORT = (50,50,55); SLIGHT = (100,100,110)
DDARK = (50,50,60); DBROW = (110,85,55)
SAVE_PATH = (180,155,115)

### PLAYER ###
def draw_player():
    g = Image.new("RGBA", (32,32), (0,0,0,0))
    r(g,10,3,12,2,HAIR); r(g,11,2,10,2,DBLUE); r(g,15,1,2,1,LBLUE)
    r(g,11,6,10,8,SKIN); r(g,10,7,1,6,SKIN); r(g,21,7,1,6,SKIN)
    r(g,12,8,3,3,EYE); r(g,17,8,3,3,EYE)
    p(g,13,9,BLUE); p(g,18,9,BLUE); p(g,13,8,WHITE); p(g,18,8,WHITE)
    p(g,15,12,RED); p(g,16,12,RED); r(g,14,15,4,1,SKIN)
    r(g,9,16,14,8,BLUE); r(g,10,16,12,2,LBLUE); r(g,15,16,2,8,WHITE)
    r(g,5,17,4,7,DBLUE); r(g,23,17,4,7,DBLUE); r(g,5,23,4,2,SKIN); r(g,23,23,4,2,SKIN)
    r(g,9,24,14,2,LGREEN); r(g,10,26,4,3,DBLUE); r(g,18,26,4,3,DBLUE)
    r(g,9,29,5,3,BROWN); r(g,18,29,5,3,BROWN)
    r(g,11,4,10,3,HAIR); r(g,11,5,3,1,HAIR); r(g,18,5,3,1,HAIR)
    return g

### SLIME ###
def draw_slime():
    g = Image.new("RGBA", (32,32), (0,0,0,0))
    rows = {8:(15,16),9:(14,17),10:(13,18),11:(13,18),12:(12,19),13:(11,20),
            14:(10,21),15:(10,21),16:(9,22),17:(8,23),18:(7,24),19:(6,25),
            20:(7,24),21:(8,23),22:(9,22),23:(10,21),24:(11,20),25:(12,19)}
    for y,(L,R) in rows.items():
        for x in range(L,R+1):
            c = DGREEN if y >= 20 else (LGREEN if y <= 11 else GREEN)
            p(g,x,y,c)
    r(g,12,15,3,3,EYE); r(g,17,15,3,3,EYE)
    p(g,13,16,BLACK); p(g,18,16,BLACK)
    p(g,15,20,DGREEN); p(g,16,20,DGREEN)
    return g

### GOBLIN ###
def draw_goblin():
    g = Image.new("RGBA", (32,32), (0,0,0,0))
    for ex,ey in [(8,7),(7,8),(7,9),(7,10),(23,7),(24,8),(24,9),(24,10)]:
        p(g,ex,ey,GOB)
    r(g,9,6,14,11,GOB); r(g,10,5,12,2,DGOB); r(g,9,6,1,3,DGOB); r(g,22,6,1,3,DGOB)
    r(g,12,9,3,2,EYE); r(g,17,9,3,2,EYE); p(g,13,10,REDEYE); p(g,18,10,REDEYE)
    p(g,15,12,DGOB); p(g,16,12,DGOB); r(g,13,14,6,1,DGOB); p(g,15,15,WHITE); p(g,17,15,WHITE)
    r(g,14,17,4,1,GOB); r(g,9,18,14,7,BROWN); r(g,10,18,12,2,DBROWN)
    r(g,9,25,14,1,DBROWN); p(g,15,25,(200,180,50))
    r(g,6,19,3,6,GOB); r(g,23,19,3,6,GOB); r(g,6,19,3,2,BROWN); r(g,23,19,3,2,BROWN)
    r(g,23,13,1,4,(200,200,200)); r(g,23,17,1,3,BROWN)
    r(g,10,26,4,3,DBROWN); r(g,18,26,4,3,DBROWN); r(g,9,29,5,3,DBROWN); r(g,18,29,5,3,DBROWN)
    return g

### BAT ###
def draw_bat():
    g = Image.new("RGBA", (32,32), (0,0,0,0))
    for by in range(11,20):
        for bx in range(13,19):
            p(g,bx,by,DPURP)
    p(g,14,10,DPURP); p(g,15,10,DPURP); p(g,16,10,DPURP); p(g,17,10,DPURP)
    p(g,14,20,DPURP); p(g,15,20,DPURP); p(g,16,20,DPURP); p(g,17,20,DPURP)
    p(g,15,21,DPURP); p(g,16,21,DPURP)
    r(g,13,8,6,3,PURP); r(g,14,7,4,1,PURP); p(g,15,6,PURP); p(g,16,6,PURP)
    p(g,13,5,DPURP); p(g,18,5,DPURP); p(g,14,9,REDEYE); p(g,17,9,REDEYE)
    left = [(12,11),(11,12),(10,12),(9,12),(8,13),(7,14),(6,14),(5,15),(4,16),(3,17),(2,18),
            (10,13),(9,13),(8,14),(7,15),(6,15),(5,16),(4,17),(3,18),(4,18),
            (7,15),(8,15),(9,14),(10,14)]
    for wx,wy in left:
        if 0<=wx<32 and 0<=wy<32:
            p(g,wx,wy,PURP)
            mx = 31-wx; p(g,mx,wy,PURP)
    return g

### FOREST ###
def draw_forest():
    g = Image.new("RGBA", (64,64), (0,0,0,0))
    for y in range(64):
        for x in range(64):
            c = FBG
            if (x*7+y*13)%11==0: c = FDARK
            elif (x*3+y*17)%13==0: c = FLIGHT
            p(g,x,y,c)
    path = [(0,50),(2,50),(4,51),(6,51),(8,51),(10,52),(12,52),(14,53),(16,54),(18,54),(20,54),(22,54),(24,54)]
    for px,py in path:
        r(g,px,py,4,2,SAVE_PATH)
    r(g,0,58,64,6,GRASS); r(g,0,61,64,3,FDARK)
    r(g,8,30,4,20,TRUNK); circ(g,10,14,10,TGREEN); circ(g,5,22,7,GREEN); circ(g,15,20,6,FLIGHT)
    r(g,48,35,3,15,TRUNK); circ(g,49,20,9,TGREEN); circ(g,45,28,6,GREEN)
    for bx,by in [(2,35),(25,40),(30,42),(55,45),(60,42)]:
        circ(g,bx,by,4,GREEN)
    for fx,fy in [(20,45),(35,48),(45,50)]:
        r(g,fx,fy,2,2,RED); p(g,fx+1,fy+1,(255,220,50))
    return g

### DUNGEON ###
def draw_dungeon():
    g = Image.new("RGBA", (64,64), (0,0,0,0))
    bw,bh = 16,8
    for y in range(64):
        for x in range(64):
            row = y//bh; off = (row%2)*(bw//2); bx = (x+off)%bw; by_ = y%bh
            if bx==0 or by_==0: c = MORT
            elif (x+y)%11==0: c = SLIGHT
            elif (x+y)%13==0: c = DDARK
            else: c = STONE
            p(g,x,y,c)
    r(g,18,6,2,64,DBROW); r(g,43,6,2,64,DBROW)
    circ(g,31,20,14,DBROW); circ(g,31,20,11,DDARK); r(g,20,20,23,50,DDARK)
    for y in range(22,60,6): r(g,20,y,23,1,DBROW)
    r(g,11,22,2,5,BROWN); p(g,11,19,(255,180,50)); p(g,12,19,(255,220,80)); p(g,11,18,(255,100,30))
    r(g,50,22,2,5,BROWN); p(g,50,19,(255,180,50)); p(g,51,19,(255,220,80)); p(g,50,18,(255,100,30))
    r(g,0,58,64,6,DDARK)
    for y in range(0,16,2): p(g,5,y,(160,140,110)); p(g,6,y,(160,140,110))
    for y in range(0,13,2): p(g,58,y,(160,140,110)); p(g,59,y,(160,140,110))
    r(g,36,25,5,5,(220,210,190)); p(g,37,27,(40,40,40)); p(g,39,27,(40,40,40)); p(g,38,29,(40,40,40))
    return g

### MAIN ###
sp = "/home/user/mmorpg-farcaster-mini2/assets/sprites"
tp = "/home/user/mmorpg-farcaster-mini2/assets/tilesets"
for fn, fn_ in [("player","player"),("slime","slime"),("goblin","goblin"),("bat","bat")]:
    img = globals()[f"draw_{fn_}"]()
    img.save(f"{sp}/{fn_}.png")
    print(f"  {sp}/{fn_}.png")
for fn, fn_ in [("forest","forest"),("dungeon","dungeon")]:
    img = globals()[f"draw_{fn_}"]()
    img.save(f"{tp}/tiles_{fn_}.png")
    print(f"  {tp}/tiles_{fn_}.png")
print("Done!")
