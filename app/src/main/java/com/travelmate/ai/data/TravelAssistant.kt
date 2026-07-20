package com.travelmate.ai.data

import kotlinx.coroutines.delay

data class TravelIntent(
    val destination: String,
    val days: Int,
    val travelers: String,
    val preference: String,
    val confidence: Int
)

data class DayPlan(
    val day: Int,
    val title: String,
    val stops: List<String>,
    val transport: String
)

data class ServiceRecommendation(
    val icon: String,
    val title: String,
    val description: String,
    val tag: String
)

data class TravelPlan(
    val intent: TravelIntent,
    val summary: String,
    val days: List<DayPlan>,
    val services: List<ServiceRecommendation>
)

/** Boundary for replacing the demo engine with an LLM/backend implementation. */
interface TravelAssistant {
    suspend fun plan(message: String): TravelPlan
}

class DemoTravelAssistant : TravelAssistant {
    override suspend fun plan(message: String): TravelPlan {
        delay(900)
        val destination = listOf("上海", "杭州", "成都", "北京", "厦门", "西安")
            .firstOrNull { message.contains(it) } ?: "杭州"
        val days = Regex("(\\d+)\\s*天").find(message)?.groupValues?.get(1)?.toIntOrNull()?.coerceIn(1, 7) ?: 3
        val travelers = when {
            listOf("孩子", "亲子", "小朋友").any(message::contains) -> "亲子"
            listOf("爸妈", "父母", "老人").any(message::contains) -> "家庭"
            listOf("情侣", "女友", "男友").any(message::contains) -> "情侣"
            else -> "休闲出行"
        }
        val preference = when {
            listOf("美食", "吃", "餐厅").any(message::contains) -> "美食体验"
            listOf("自然", "山", "湖").any(message::contains) -> "自然风光"
            listOf("历史", "博物馆", "文化").any(message::contains) -> "人文历史"
            else -> "经典与慢游"
        }
        val templates = mapOf(
            "杭州" to listOf("西湖·断桥" to "湖滨步行", "灵隐寺·法喜寺" to "地铁 + 公交", "龙井村·九溪" to "网约车"),
            "上海" to listOf("外滩·南京东路" to "地铁 + 步行", "武康路·安福路" to "地铁", "浦东美术馆·陆家嘴" to "轮渡 + 步行"),
            "成都" to listOf("宽窄巷子·人民公园" to "地铁", "熊猫基地·东郊记忆" to "景区直通车", "武侯祠·锦里" to "地铁 + 步行"),
            "北京" to listOf("天安门·故宫" to "地铁 + 步行", "颐和园·圆明园" to "地铁", "慕田峪长城" to "旅游专线"),
            "厦门" to listOf("鼓浪屿" to "轮渡 + 步行", "厦大·沙坡尾" to "公交", "环岛路·曾厝垵" to "骑行"),
            "西安" to listOf("城墙·钟鼓楼" to "地铁 + 步行", "兵马俑·华清宫" to "旅游专线", "陕西历史博物馆·大雁塔" to "地铁")
        )
        val spots = templates[destination] ?: templates.getValue("杭州")
        val dayPlans = (1..days).map { index ->
            val item = spots[(index - 1) % spots.size]
            DayPlan(index, if (index == 1) "初见$destination" else "深度体验", item.first.split("·"), item.second)
        }
        return TravelPlan(
            TravelIntent(destination, days, travelers, preference, 96),
            "已为你生成 $days 天的$destination轻松行程，动线尽量顺路，并留出了休息时间。",
            dayPlans,
            listOf(
                ServiceRecommendation("🏨", "精选住宿", "近核心商圈，出行更省时", "¥420 起"),
                ServiceRecommendation("🎫", "景点预约", "热门景点门票与预约提醒", "提前预约"),
                ServiceRecommendation("🚕", "接送用车", "机场/车站至酒店一口价", "新人立减"),
                ServiceRecommendation("🍜", "当地美食", "按你的口味精选口碑餐厅", "少排队")
            )
        )
    }
}

