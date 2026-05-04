# 《落星》—— 全局定义
#
# 角色、图像、变量集中管理


##############################################################################
## 8-bit 声效回调
##############################################################################

init python:
    class VoiceCallback:
        def __init__(self, char_id):
            self.char_id = char_id
        def __call__(self, event, **kwargs):
            if event == "show" or event == "begin":
                try:
                    renpy.play("audio/" + self.char_id + "_voice.ogg", "sound", loop=False)
                except:
                    pass


##############################################################################
## 角色立绘位置（SVG 全帧偏移修正）
##############################################################################

transform sprite_left:
    xalign 0.0 xoffset -560 yalign 1.0

transform sprite_right:
    xalign 0.0 xoffset 560 yalign 1.0

transform sprite_center:
    xalign 0.0 yalign 1.0


##############################################################################
## 角色定义
##############################################################################

define lk = Character("李可",
    color="#d4c5a9",
    callback=VoiceCallback("lk"))

define cf = Character("陈锋",
    color="#8899aa",
    callback=VoiceCallback("chen"))

define zq = Character("周晴",
    color="#aaccbb",
    callback=VoiceCallback("zhou"))

define zm = Character("赵明远",
    color="#c8b88a",
    callback=VoiceCallback("zhao"))

define bc = Character("播音员",
    color="#888888",
    callback=VoiceCallback("bc"))

define narr = Character("",
    what_prefix="",
    what_suffix="",
    what_color="#d4d0c8",
    what_size=20)

define unk = Character("？？？",
    color="#aaaaaa",
    callback=VoiceCallback("bc"))

# 内心独白（无引号框）
define inner = Character("",
    what_prefix="",
    what_suffix="",
    what_color="#d4c5a9",
    what_italic=True)


##############################################################################
## 背景定义（占位色块，可用真实图片替换）
##############################################################################

image bg wilderness = "images/bg_wilderness.svg"
image bg base_interior = "images/bg_base_interior.svg"
image bg base_exterior = "images/bg_base_exterior.svg"
image bg city_ruins = "images/bg_city_ruins.svg"
image bg archives = "images/bg_archives.svg"
image bg rescue_site = "images/bg_rescue_site.svg"
image bg observatory = "images/bg_observatory.svg"
image bg hometown = "images/bg_hometown.svg"
image bg highway = "images/bg_highway.svg"
image bg night_sky = "images/bg_night_sky.svg"
image bg house_interior = "images/bg_house_interior.svg"
image bg white = "#ffffff"
image bg black = "#000000"


##############################################################################
## 序章角色立绘占位
##############################################################################

image lk neutral = "images/lk_neutral.svg"
image lk serious = "images/lk_serious.svg"
image lk sad = "images/lk_sad.svg"
image lk determined = "images/lk_determined.svg"

image chen neutral = "images/chen_neutral.svg"
image chen urgent = "images/chen_urgent.svg"

image zhou smile = "images/zhou_smile.svg"
image zhou worried = "images/zhou_worried.svg"

image zhao neutral = "images/zhao_neutral.svg"
image zhao emotional = "images/zhao_emotional.svg"


##############################################################################
## 第二章背景定义
##############################################################################

image bg shelter = "images/bg_shelter.svg"
image bg museum = "images/bg_museum.svg"
image bg camp = "images/bg_camp.svg"
image bg terminal = "images/bg_terminal.svg"
image bg attic = "images/bg_attic.svg"
image bg rooftop = "images/bg_rooftop.svg"
image bg road_north = "images/bg_road_north.svg"


##############################################################################
## 第二章角色立绘占位
##############################################################################

image lk tired = "images/lk_tired.svg"
image lk thoughtful = "images/lk_thoughtful.svg"

image chen exhausted = "images/chen_exhausted.svg"

image zhou sad = "images/zhou_sad.svg"

image xiaoyu = "images/xiaoyu.svg"
image radio_op = "images/radio_op.svg"
image traveler = "images/traveler.svg"
image scientist = "images/scientist.svg"


##############################################################################
## 第三章背景定义
##############################################################################

image bg mountain_road = "images/bg_mountain_road.svg"
image bg facility_exterior = "images/bg_facility_exterior.svg"
image bg facility_interior = "images/bg_facility_interior.svg"
image bg control_room = "images/bg_control_room.svg"
image bg comms_room = "images/bg_comms_room.svg"
image watchman = "images/watchman.svg"
image bc = "images/bc.svg"


##############################################################################
## 变量初始化
##############################################################################

default route_chosen = ""


##############################################################################
## 音频定义
##############################################################################

define audio.opening = "audio/opening.ogg"
define audio.base = "audio/base.ogg"
define audio.crash = "audio/crash.ogg"
define audio.route_memory = "audio/route_memory.ogg"
define audio.route_duty = "audio/route_duty.ogg"
define audio.route_truth = "audio/route_truth.ogg"
define audio.route_home = "audio/route_home.ogg"
define audio.soil_theme = "audio/soil_theme.ogg"

define audio.lk_voice = "audio/lk_voice.ogg"
define audio.chen_voice = "audio/chen_voice.ogg"
define audio.zhou_voice = "audio/zhou_voice.ogg"
define audio.zhao_voice = "audio/zhao_voice.ogg"
define audio.xiaoyu_voice = "audio/xiaoyu_voice.ogg"
define audio.radio_op_voice = "audio/radio_op_voice.ogg"
define audio.traveler_voice = "audio/traveler_voice.ogg"
define audio.scientist_voice = "audio/scientist_voice.ogg"
define audio.watchman_voice = "audio/watchman_voice.ogg"
define audio.bc_voice = "audio/bc_voice.ogg"
