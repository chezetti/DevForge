'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const RECENT_KEY = 'devforge-emoji-recent-v1'
const CAT_LABEL: Record<string, string> = {
  smileys: 'Smileys',
  people: 'People',
  animals: 'Animals',
  food: 'Food',
  travel: 'Travel',
  activities: 'Activities',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
}

/** Curated popular emojis — pipe format: emoji|slug-name|category */
const EMOJI_PIPE_DATA = `
😀|grinning-face|smileys|😃|smiling-eyes|smileys|😄|open-mouth-smile|smileys|😁|beaming|smileys|😅|sweat-smile|smileys|😂|joy|smileys|🤣|rofl|smileys|😊|blush-smile|smileys|😇|halo|smileys|🙂|slight-smile|smileys|😉|wink|smileys|😍|heart-eyes|smileys|🥰|hearts-smile|smileys|😘|kiss|smileys|😗|kiss-face|smileys|😙|kiss-smile|smileys|😚|kiss-closed|smileys|😋|yummy|smileys|😛|tongue|smileys|😜|wink-tongue|smileys|😝|squint-tongue|smileys|🤪|zany|smileys|🤨|raised-eyebrow|smileys|🧐|monocle|smileys|🤓|nerd|smileys|😎|cool|smileys|🥸|disguise|smileys|🤩|star-eyes|smileys|🥳|party|smileys|😏|smirk|smileys|😒|unamused|smileys|😞|disappointed|smileys|😔|pensive|smileys|😟|worried|smileys|😕|confused|smileys|🙁|slight-frown|smileys|☹|frown|smileys|😣|persevere|smileys|😖|confounded|smileys|😫|tired|smileys|😩|weary|smileys|🥺|pleading|smileys|😢|cry|smileys|😭|loud-cry|smileys|😤|triumph|smileys|😠|angry|smileys|😡|rage|smileys|🤬|symbols-mouth|smileys|🤯|exploding-head|smileys|😳|flushed|smileys|🥵|hot|smileys|🥶|cold|smileys|😱|scream|smileys|😨|fearful|smileys|😰|anxious|smileys|😥|sad-relieved|smileys|🤗|hugs|smileys|🤔|thinking|smileys|🤭|hand-over-mouth|smileys|🤫|shush|smileys|🤥|lying|smileys|😶|no-mouth|smileys|😐|neutral|smileys|😑|expressionless|smileys|😬|grimace|smileys|🙄|roll-eyes|smileys|😯|hushed|smileys|😦|frown-open|smileys|😧|anguished|smileys|😮|open-mouth|smileys|😲|astonished|smileys|🥱|yawn|smileys|😴|sleep|smileys|🤤|drool|smileys|😪|sleepy|smileys|😵|dizzy-face|smileys|🤐|zipper|smileys|🥴|woozy|smileys|🤢|nauseated|smileys|🤮|vomit|smileys|🤧|sneeze|smileys|🤒|thermometer|smileys|🤕|bandage|smileys|👍|thumbs-up|people|👎|thumbs-down|people|👌|ok-hand|people|🤌|pinched-fingers|people|✌|victory|people|🤞|fingers-crossed|people|🤟|love-you|people|🤘|rock-on|people|🤙|call-me|people|👈|point-left|people|👉|point-right|people|👆|point-up|people|👇|point-down|people|☝|index-up|people|👋|wave|people|🤚|raised-back|people|🖐|fingers-splayed|people|✋|raised-hand|people|👏|clap|people|🙌|celebrate|people|🤲|palms-up|people|🙏|pray|people|💪|flex|people|🦾|mech-arm|people|🦿|mech-leg|people|🦵|leg|people|🦶|foot|people|👂|ear|people|🦻|ear-aid|people|👃|nose|people|🧠|brain|people|🫀|heart-organ|people|🫁|lungs|people|🦷|tooth|people|🦴|bone|people|👀|eyes|people|👁|eye|people|👅|tongue|people|👄|lips|people|💋|kiss-mark|people|🩸|blood|people|💧|droplet|people|👶|baby|people|🧒|child|people|👦|boy|people|👧|girl|people|🧑|adult|people|👱|blond|people|👨|man|people|🧔|beard|people|👩|woman|people|🧓|older|people|👴|old-man|people|👵|old-woman|people|👮|police|people|🕵|detective|people|💂|guard|people|👷|construction|people|🤴|prince|people|👸|princess|people|👳|turban|people|👲|cap|people|🧕|headscarf|people|🤵|tux|people|👰|veil|people|🤰|pregnant|people|🧑‍🍼|nursing|people|👼|angel|people|🎅|santa|people|🧙|mage|people|🧚|fairy|people|🧛|vampire|people|🧜|merperson|people|🧝|elf|people|💆|massage|people|💇|haircut|people|🚶|walking|people|🧍|standing|people|🧎|kneeling|people|🏃|running|people|💃|dance|people|🕺|man-dance|people|🕴|levitate|people|👯|bunny-ears|people|🧖|steam-room|people|🧗|climb|people|🤺|fencing|people|🏇|horse-race|people|⛷|skier|activities|🏂|snowboard|activities|🏌|golf|activities|🏄|surf|activities|🚣|rowboat|activities|🏊|swim|activities|⛹|basketball|activities|🏋|lift|activities|🚴|bike|activities|🚵|mtn-bike|activities|🤸|cartwheel|activities|🤼|wrestle|activities|🤽|water-polo|activities|🤾|handball|activities|🤹|juggle|activities|🧘|yoga|activities|🎪|circus|activities|🎭|masks|activities|🎨|palette|activities|🎬|clapper|activities|🎤|mic|activities|🎧|headphones|activities|🎼|score|activities|🎹|piano|activities|🥁|drum|activities|🎷|sax|activities|🎺|trumpet|activities|🎸|guitar|activities|🎻|violin|activities|🎲|dice|activities|♟|chess|activities|🎯|bullseye|activities|🎳|bowling|activities|🎮|gamepad|activities|🕹|joystick|activities|🎰|slots|activities|🐶|dog-face|animals|🐱|cat-face|animals|🐭|mouse-face|animals|🐹|hamster|animals|🐰|rabbit-face|animals|🦊|fox|animals|🐻|bear|animals|🐼|panda|animals|🐨|koala|animals|🐯|tiger|animals|🦁|lion|animals|🐮|cow|animals|🐷|pig|animals|🐸|frog|animals|🐵|monkey-face|animals|🙈|see-no|animals|🙉|hear-no|animals|🙊|speak-no|animals|🐒|monkey|animals|🐔|chicken|animals|🐧|penguin|animals|🐦|bird|animals|🐤|chick|animals|🐦‍⬛|black-bird|animals|🦅|eagle|animals|🦆|duck|animals|🦢|swan|animals|🦉|owl|animals|🦇|bat|animals|🐺|wolf|animals|🐗|boar|animals|🐴|horse|animals|🦄|unicorn|animals|🐝|bee|animals|🐛|bug|animals|🦋|butterfly|animals|🐌|snail|animals|🐞|ladybug|animals|🐜|ant|animals|🪲|beetle|animals|🐢|turtle|animals|🐍|snake|animals|🦎|lizard|animals|🐙|octopus|animals|🦑|squid|animals|🦀|crab|animals|🦞|lobster|animals|🐠|fish|animals|🐟|fish2|animals|🐡|blowfish|animals|🐬|dolphin|animals|🐳|whale|animals|🦈|shark|animals|🐊|croc|animals|🦕|sauropod|animals|🦖|t-rex|animals|🐘|elephant|animals|🦣|mammoth|animals|🦏|rhino|animals|🦛|hippo|animals|🐪|camel|animals|🦒|giraffe|animals|🦘|kangaroo|animals|🐃|buffalo|animals|🐂|ox|animals|🐄|cow2|animals|🐎|racehorse|animals|🐖|pig2|animals|🐏|ram|animals|🐑|ewe|animals|🐐|goat|animals|🦌|deer|animals|🐕|dog2|animals|🦮|guide-dog|animals|🐩|poodle|animals|🐈|cat2|animals|🐓|rooster|animals|🦃|turkey|animals|🦚|peacock|animals|🦜|parrot|animals|🌲|evergreen|travel|🌳|tree|travel|🌴|palm|travel|🌵|cactus|travel|🌾|sheaf|travel|🌿|herb|travel|☘|shamrock|travel|🍀|clover|travel|🍁|maple|travel|🍂|fallen-leaf|travel|🍃|wind-leaf|travel|🌍|globe-europe|travel|🌎|globe-americas|travel|🌏|globe-asia|travel|🌐|globe-meridians|travel|🗺|map|travel|🧭|compass|travel|🏔|snow-mtn|travel|⛰|mountain|travel|🌋|volcano|travel|🏕|camping|travel|🏖|beach|travel|🏜|desert|travel|🏝|island|travel|🏞|park|travel|🏟|stadium|travel|🏛|classical|travel|🏗|construction|travel|🧱|brick|travel|🏘|houses|travel|🏚|derelict|travel|🏠|house|travel|🏡|house-garden|travel|🏢|office|travel|🏣|jp-post|travel|🏤|euro-post|travel|🏥|hospital|travel|🏦|bank|travel|🏨|hotel|travel|🏫|school|travel|🏬|department|travel|🏭|factory|travel|🗼|tower|travel|🗽|liberty|travel|⛪|church|travel|🕌|mosque|travel|⛩|shrine|travel|🕋|kaaba|travel|🌁|foggy|travel|🌃|night|travel|🌄|sunrise-hills|travel|🌅|sunrise|travel|🌆|city-dusk|travel|🌇|sunset|travel|🌉|bridge-night|travel|♨|hotsprings|travel|🎠|carousel|travel|🎡|ferris|travel|🎢|coaster|travel|💈|barber|travel|🎪|circus-tent|travel|🚂|locomotive|travel|🚃|railcar|travel|🚄|bullet-train|travel|🚅|bullet-front|travel|🚆|train|travel|🚇|metro|travel|🚈|light-rail|travel|🚉|station|travel|🚊|tram|travel|🚝|monorail|travel|🚞|mtn-rail|travel|🚋|tram-car|travel|🚌|bus|travel|🚍|oncoming-bus|travel|🚎|trolley|travel|🚐|minibus|travel|🚑|ambulance|travel|🚒|fire-engine|travel|🚓|police-car|travel|🚔|oncoming-police|travel|🚕|taxi|travel|🚖|oncoming-taxi|travel|🚗|car|travel|🚘|oncoming-car|travel|🚙|suv|travel|🛻|pickup|travel|🚚|truck|travel|🚛|articulated|travel|🚜|tractor|travel|🛵|scooter|travel|🦽|manual-wheelchair|travel|🦼|power-wheelchair|travel|🛺|auto-rickshaw|travel|🚲|bicycle|travel|🛴|kick-scooter|travel|🅿|parking|symbols|🍇|grapes|food|🍈|melon|food|🍉|watermelon|food|🍊|orange|food|🍋|lemon|food|🍌|banana|food|🍍|pineapple|food|🥭|mango|food|🍎|apple|food|🍏|green-apple|food|🍐|pear|food|🍑|peach|food|🍒|cherries|food|🍓|strawberry|food|🫐|blueberries|food|🥝|kiwi|food|🍅|tomato|food|🫒|olive|food|🥥|coconut|food|🥑|avocado|food|🍆|eggplant|food|🥔|potato|food|🥕|carrot|food|🌽|corn|food|🌶|hot-pepper|food|🫑|bell-pepper|food|🥒|cucumber|food|🥬|leafy-green|food|🥦|broccoli|food|🧄|garlic|food|🧅|onion|food|🍄|mushroom|food|🥜|peanuts|food|🌰|chestnut|food|🍞|bread|food|🥐|croissant|food|🥖|baguette|food|🫓|flatbread|food|🥨|pretzel|food|🥯|bagel|food|🥞|pancakes|food|🧇|waffle|food|🧀|cheese|food|🍖|meat|food|🍗|poultry-leg|food|🥩|cut-meat|food|🥓|bacon|food|🍔|burger|food|🍟|fries|food|🍕|pizza|food|🌭|hotdog|food|🥪|sandwich|food|🌮|taco|food|🌯|burrito|food|🫔|tamale|food|🥙|stuffed-flatbread|food|🧆|falafel|food|🥚|egg|food|🍳|cooking|food|🥘|paella|food|🍲|pot-food|food|🫕|fondue|food|🥣|bowl|food|🥗|salad|food|🍿|popcorn|food|🧈|butter|food|🧂|salt|food|🥫|canned|food|🍱|bento|food|🍘|rice-cracker|food|🍙|rice-ball|food|🍚|rice|food|🍛|curry|food|🍜|ramen|food|🍝|spaghetti|food|🍠|sweet-potato|food|🍢|oden|food|🍣|sushi|food|🍤|fried-shrimp|food|🍥|fish-cake|food|🥮|moon-cake|food|🍡|dango|food|🥟|dumpling|food|🥠|fortune|food|🥡|takeout|food|🦀|crab-food|food|🦞|lobster-food|food|🐡|fugu|food|🍦|soft-ice|food|🍧|shaved-ice|food|🍨|ice-cream|food|🍩|donut|food|🍪|cookie|food|🎂|birthday-cake|food|🍰|shortcake|food|🧁|cupcake|food|🥧|pie|food|🍫|chocolate|food|🍬|candy|food|🍭|lollipop|food|🍮|custard|food|🍯|honey|food|🍼|baby-bottle|food|🥛|milk|food|☕|coffee|food|🫖|teapot|food|🍵|tea|food|🍶|sake|food|🍾|champagne|food|🍷|wine|food|🍸|cocktail|food|🍹|tropical|food|🍺|beer|food|🍻|beers|food|🥂|clink|food|🥃|whisky|food|🥤|cup-straw|food|🧋|bubble-tea|food|🧃|juice-box|food|🧉|mate|food|💎|gem|objects|🔇|mute|objects|🔈|speaker-low|objects|🔉|speaker-mid|objects|🔊|speaker-high|objects|📢|loudspeaker|objects|📣|megaphone|objects|📯|horn|objects|🔔|bell|objects|🔕|no-bell|objects|🎼|notes|objects|🎵|note|objects|🎶|notes-many|objects|📱|iphone|objects|📞|phone|objects|☎|phone-classic|objects|📟|pager|objects|📠|fax|objects|🔋|battery|objects|🪫|low-battery|objects|🔌|plug|objects|💻|laptop|objects|🖥|desktop|objects|🖨|printer|objects|⌨|keyboard|objects|🖱|mouse|objects|💽|minidisc|objects|💾|floppy|objects|💿|cd|objects|📀|dvd|objects|🧮|abacus|objects|🎥|movie-cam|objects|📷|camera|objects|📸|flash|objects|🎞|film|objects|📽|projector|objects|📺|tv|objects|🔍|mag-right|objects|💡|bulb|objects|🔦|flashlight|objects|🏮|lantern|objects|📔|notebook-decor|objects|📕|closed-book|objects|📗|green-book|objects|📘|blue-book|objects|📙|orange-book|objects|📓|notebook|objects|📖|open-book|objects|📚|books|objects|📃|page-curl|objects|📄|page|objects|📝|memo|objects|💼|briefcase|objects|📁|folder|objects|📂|open-folder|objects|🗂|dividers|objects|📅|calendar|objects|📆|tear-calendar|objects|🗒|notepad|objects|🗓|spiral-calendar|objects|📇|card-index|objects|📈|chart-up|objects|📉|chart-down|objects|📊|bar-chart|objects|📋|clipboard|objects|📌|pin|objects|📍|round-pin|objects|📎|paperclip|objects|🖇|clips|objects|📏|ruler|objects|📐|triangle-ruler|objects|✂|scissors|objects|🗃|file-box|objects|🗄|file-cabinet|objects|🗑|wastebasket|objects|🔒|lock|objects|🔓|unlock|objects|🔏|lock-pen|objects|🔑|key|objects|🗝|old-key|objects|🔨|hammer|objects|🪓|axe|objects|⛏|pick|objects|⚒|hammer-pick|objects|🛠|wrench-hammer|objects|🗡|dagger|objects|⚔|crossed-swords|objects|🔫|water-pistol|objects|🪃|boomerang|objects|🏹|bow|objects|🛡|shield|objects|🔧|wrench|objects|🔩|nut-bolt|objects|⚙|gear|objects|🗜|clamp|objects|⚖|scales|objects|🔗|link|objects|⛓|chains|objects|🧰|toolbox|objects|🧲|magnet|objects|🪜|ladder|objects|💉|syringe|objects|🩸|blood-drop|objects|💊|pill|objects|🩹|bandaid|objects|🚪|door|objects|🛏|bed|objects|🛋|couch-lamp|objects|🚽|toilet|objects|🪠|plunger|objects|🚿|shower|objects|🛁|bathtub|objects|🧴|lotion|objects|🧷|safety-pin|objects|🧹|broom|objects|🧺|basket|objects|🧻|roll-paper|objects|🪒|razor|objects|🧼|soap|objects|🪥|toothbrush|objects|🧽|sponge|objects|🪣|bucket|objects|🧯|extinguisher|objects|🛒|cart|symbols|⚠|warning|symbols|♻|recycle|symbols|✅|check-box|symbols|❌|cross-mark|symbols|❓|question|symbols|❗|bang|symbols|⚡|high-voltage|symbols|🔥|fire|symbols|✨|sparkles|symbols|⭐|star|symbols|🌟|glow-star|symbols|💫|dizzy|symbols|💥|collision|symbols|💢|anger|symbols|💯|hundred|symbols|💤|zzz|symbols|⏰|alarm|symbols|⏱|stopwatch|symbols|⏲|timer|symbols|🕐|one-oclock|symbols|🕑|two-oclock|symbols|📛|name-badge|symbols|🔰|jp-beginner|symbols|💹|chart-yen|symbols|💱|currency-exchange|symbols|💲|heavy-dollar|symbols|💳|credit-card|symbols|🏧|atm|symbols|🆎|blood-type-ab|symbols|🅾|blood-type-o|symbols|🆑|cl|symbols|🆘|sos|symbols|🚫|no-entry-sign|symbols|❎|x-button|symbols|🔴|red-circle|symbols|🟠|orange-circle|symbols|🟡|yellow-circle|symbols|🟢|green-circle|symbols|🔵|blue-circle|symbols|🟣|purple-circle|symbols|🟤|brown-circle|symbols|⚫|black-circle|symbols|⚪|white-circle|symbols|🟥|red-square|symbols|🟧|orange-square|symbols|🟨|yellow-square|symbols|🟩|green-square|symbols|🟦|blue-square|symbols|🟪|purple-square|symbols|🟫|brown-square|symbols|⬛|black-large-square|symbols|⬜|white-large-square|symbols|🏁|checkered-flag|flags|🚩|triangular-flag|flags|🎌|crossed-flags|flags|🏴|black-flag|flags|🏳|white-flag|flags|🏳️‍🌈|rainbow-flag|flags|🏳️‍⚧️|trans-flag|flags|🏴‍☠️|pirate|flags|🇺🇸|us|flags|🇬🇧|gb|flags|🇨🇦|ca|flags|🇦🇺|au|flags|🇳🇿|nz|flags|🇩🇪|de|flags|🇫🇷|fr|flags|🇪🇸|es|flags|🇮🇹|it|flags|🇯🇵|jp|flags|🇰🇷|kr|flags|🇨🇳|cn|flags|🇮🇳|in|flags|🇧🇷|br|flags|🇲🇽|mx|flags|🇷🇺|ru|flags|🇺🇦|ua|flags|🇸🇪|se|flags|🇳🇴|no|flags|🇫🇮|fi|flags|🇵🇱|pl|flags|🇳🇱|nl|flags|🇧🇪|be|flags|🇨🇭|ch|flags|🇦🇹|at|flags|🇵🇹|pt|flags|🇮🇪|ie|flags|🇬🇷|gr|flags|🇹🇷|tr|flags|🇮🇱|il|flags|🇦🇪|ae|flags|🇸🇬|sg|flags|🇲🇾|my|flags|🇮🇩|id|flags|🇵🇭|ph|flags|🇻🇳|vn|flags|🇹🇭|th|flags|🇿🇦|za|flags|🇪🇬|eg|flags|🇳🇬|ng|flags|🇰🇪|ke|flags|🇦🇷|ar|flags|🇨🇱|cl|flags|🇨🇴|co|flags|🇵🇪|pe|flags
`.trim()

export type EmojiEntry = { emoji: string; name: string; category: string }

function parseEmojiPipe(): EmojiEntry[] {
  const parts = EMOJI_PIPE_DATA.split('|').filter(Boolean)
  const out: EmojiEntry[] = []
  for (let i = 0; i + 2 < parts.length; i += 3) {
    out.push({
      emoji: parts[i]!,
      name: parts[i + 1]!.replace(/-/g, ' '),
      category: parts[i + 2]!,
    })
  }
  return out
}

const ALL_EMOJIS = parseEmojiPipe()

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const arr = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(arr) ? arr.slice(0, 24) : []
  } catch {
    return []
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 24)))
  } catch {
    /* ignore */
  }
}

function codePointLabel(emoji: string): string {
  const cps = [...emoji].map((ch) => {
    const cp = ch.codePointAt(0) ?? 0
    const pad = cp > 0xffff ? 6 : 4
    return `U+${cp.toString(16).toUpperCase().padStart(pad, '0')}`
  })
  return cps.join(' ')
}

export function EmojiPicker() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    setRecent(loadRecent())
  }, [])

  const setRecentSafe = useCallback((updater: (prev: string[]) => string[]) => {
    setRecent((prev) => {
      const next = updater(prev)
      saveRecent(next)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ALL_EMOJIS.filter((e) => {
      if (catFilter !== 'all' && e.category !== catFilter) return false
      if (!q) return true
      return e.name.includes(q) || e.emoji.includes(q)
    })
  }, [search, catFilter])

  const onPick = useCallback(
    (emoji: string) => {
      void navigator.clipboard.writeText(emoji)
      toast.success('Emoji copied')
      setRecentSafe((prev) => {
        const rest = prev.filter((x) => x !== emoji)
        return [emoji, ...rest].slice(0, 24)
      })
    },
    [setRecentSafe],
  )

  return (
    <ToolShell toolId="emoji-picker">
      <div className="flex flex-col gap-4 max-w-5xl mx-auto h-[calc(100vh-12rem)] min-h-[480px]">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name (smile, heart, pizza…)"
              className="pl-9"
              aria-label="Search emojis"
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CAT_LABEL).map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {recent.filter((em) => ALL_EMOJIS.some((e) => e.emoji === em)).length > 0 && (
          <section className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Recent</Label>
            <div className="flex flex-wrap gap-1.5">
              {recent
                .filter((em) => ALL_EMOJIS.some((e) => e.emoji === em))
                .slice(0, 16)
                .map((em) => {
                  const meta = ALL_EMOJIS.find((e) => e.emoji === em)
                  return (
                    <Tooltip key={em}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/30 text-xl hover:bg-muted transition-colors"
                          onClick={() => onPick(em)}
                          aria-label={`Copy ${meta?.name ?? 'emoji'} ${codePointLabel(em)}`}
                        >
                          {em}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="font-medium capitalize">{meta?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{codePointLabel(em)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
            </div>
          </section>
        )}

        <ScrollArea className="flex-1 rounded-xl border border-border">
          <div className="p-3 sm:p-4 grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
            {filtered.map((e, idx) => (
              <Tooltip key={`${e.name}-${idx}`}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center rounded-lg text-2xl hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-colors"
                    onClick={() => onPick(e.emoji)}
                    aria-label={`Copy ${e.name} ${codePointLabel(e.emoji)}`}
                  >
                    {e.emoji}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium capitalize">{e.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{codePointLabel(e.emoji)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} emoji{filtered.length === 1 ? '' : 's'} · Click to copy
        </p>
      </div>
    </ToolShell>
  )
}
