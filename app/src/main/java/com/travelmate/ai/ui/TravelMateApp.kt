package com.travelmate.ai.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.travelmate.ai.data.DayPlan
import com.travelmate.ai.data.ServiceRecommendation

private val Forest = Color(0xFF174E3B)
private val Mint = Color(0xFFDCEFE6)
private val Cream = Color(0xFFF7F8F3)
private val Orange = Color(0xFFFFA05A)

@Composable
fun TravelTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Forest,
            secondary = Orange,
            background = Cream,
            surface = Color.White,
            onPrimary = Color.White
        ),
        typography = Typography(
            headlineMedium = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
            titleLarge = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
        ),
        content = content
    )
}

@Composable
fun TravelMateApp(viewModel: TravelViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    Scaffold(
        containerColor = Cream,
        topBar = { AppHeader() },
        bottomBar = {
            MessageInput(
                value = state.input,
                enabled = !state.isPlanning,
                onValueChange = viewModel::updateInput,
                onSend = { viewModel.send() }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Text("你好，我是小旅 👋", style = MaterialTheme.typography.headlineMedium, color = Forest)
                Spacer(Modifier.height(6.dp))
                Text("告诉我你想去哪、和谁、玩多久，我来安排剩下的。", color = Color(0xFF5E6D66), lineHeight = 22.sp)
            }
            if (state.userMessage == null) {
                item { SuggestionPanel(onSelect = { viewModel.send(it) }) }
            } else {
                item { UserBubble(state.userMessage!!) }
            }
            if (state.isPlanning) item { PlanningCard() }
            state.error?.let { message -> item { Text(message, color = MaterialTheme.colorScheme.error) } }
            state.plan?.let { plan ->
                item {
                    IntentCard(
                        destination = plan.intent.destination,
                        days = plan.intent.days,
                        travelers = plan.intent.travelers,
                        preference = plan.intent.preference,
                        confidence = plan.intent.confidence
                    )
                }
                item { Text(plan.summary, color = Color(0xFF42524B), lineHeight = 22.sp) }
                item { SectionTitle("为你安排的行程", "路线已优化") }
                items(plan.days) { DayPlanCard(it) }
                item { SectionTitle("旅途中可能需要", "智能推荐") }
                items(plan.services.chunked(2)) { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        row.forEach { ServiceCard(it, Modifier.weight(1f)) }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                }
                item {
                    Button(
                        onClick = { },
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        shape = RoundedCornerShape(18.dp)
                    ) { Text("保存完整行程", fontWeight = FontWeight.SemiBold) }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppHeader() = TopAppBar(
    title = {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(38.dp).background(Forest, CircleShape), contentAlignment = Alignment.Center) { Text("✦", color = Color.White, fontSize = 20.sp) }
            Spacer(Modifier.width(10.dp))
            Column { Text("旅伴 AI", fontWeight = FontWeight.Bold); Text("你的智能出行管家", fontSize = 11.sp, color = Color.Gray) }
        }
    },
    actions = { AssistChip(onClick = { }, label = { Text("行程箱") }, modifier = Modifier.padding(end = 12.dp)) },
    colors = TopAppBarDefaults.topAppBarColors(containerColor = Cream)
)

@Composable
private fun SuggestionPanel(onSelect: (String) -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = Mint), shape = RoundedCornerShape(24.dp)) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("试着这样告诉我", fontWeight = FontWeight.Bold, color = Forest)
            listOf(
                "带爸妈去杭州玩3天，想看自然风景",
                "周末情侣去上海，喜欢美食和拍照",
                "带孩子成都4日游，行程不要太赶"
            ).forEach { prompt ->
                Surface(onClick = { onSelect(prompt) }, color = Color.White.copy(alpha = .9f), shape = RoundedCornerShape(14.dp)) {
                    Row(Modifier.fillMaxWidth().padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("↗", color = Forest); Spacer(Modifier.width(10.dp)); Text(prompt, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun UserBubble(message: String) = Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
    Surface(color = Forest, shape = RoundedCornerShape(20.dp, 20.dp, 4.dp, 20.dp), modifier = Modifier.fillMaxWidth(.86f)) {
        Text(message, color = Color.White, modifier = Modifier.padding(16.dp), lineHeight = 21.sp)
    }
}

@Composable
private fun PlanningCard() = Card(shape = RoundedCornerShape(18.dp)) {
    Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
        CircularProgressIndicator(Modifier.size(24.dp), strokeWidth = 3.dp, color = Forest)
        Spacer(Modifier.width(14.dp)); Column { Text("正在理解你的需求…", fontWeight = FontWeight.Bold); Text("规划顺路动线与合适服务", fontSize = 13.sp, color = Color.Gray) }
    }
}

@Composable
private fun IntentCard(destination: String, days: Int, travelers: String, preference: String, confidence: Int) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(22.dp)) {
        Column(Modifier.padding(18.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("已识别出行意图", fontWeight = FontWeight.Bold, color = Forest)
                Text("匹配度 $confidence%", fontSize = 12.sp, color = Forest, modifier = Modifier.background(Mint, RoundedCornerShape(20.dp)).padding(horizontal = 10.dp, vertical = 5.dp))
            }
            Spacer(Modifier.height(14.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                IntentTag("目的地", destination); IntentTag("时长", "${days}天"); IntentTag("同行", travelers); IntentTag("偏好", preference)
            }
        }
    }
}

@Composable private fun IntentTag(label: String, value: String) = Column(horizontalAlignment = Alignment.CenterHorizontally) {
    Text(label, color = Color.Gray, fontSize = 11.sp); Spacer(Modifier.height(4.dp)); Text(value, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
}

@Composable private fun SectionTitle(title: String, badge: String) = Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
    Text(title, style = MaterialTheme.typography.titleLarge, color = Forest)
    Text(badge, fontSize = 11.sp, color = Color(0xFF9B571E))
}

@Composable
private fun DayPlanCard(plan: DayPlan) {
    Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.padding(16.dp)) {
            Box(Modifier.size(46.dp).background(Mint, RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) { Text("D${plan.day}", color = Forest, fontWeight = FontWeight.Bold) }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(plan.title, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(7.dp)); Text(plan.stops.joinToString("  →  "), color = Color(0xFF44554D), fontSize = 14.sp)
                Spacer(Modifier.height(8.dp)); Text("🚇 ${plan.transport}", color = Color.Gray, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun ServiceCard(service: ServiceRecommendation, modifier: Modifier = Modifier) {
    Card(modifier, shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.padding(14.dp)) {
            Text(service.icon, fontSize = 25.sp); Spacer(Modifier.height(8.dp)); Text(service.title, fontWeight = FontWeight.Bold)
            Text(service.description, fontSize = 11.sp, color = Color.Gray, lineHeight = 16.sp, minLines = 2)
            Spacer(Modifier.height(8.dp)); Text(service.tag, color = Color(0xFFB65B1D), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun MessageInput(value: String, enabled: Boolean, onValueChange: (String) -> Unit, onSend: () -> Unit) {
    Surface(shadowElevation = 10.dp, color = Color.White) {
        Row(Modifier.navigationBarsPadding().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("说说你的出行计划…") },
                enabled = enabled,
                singleLine = true,
                shape = RoundedCornerShape(18.dp),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = Color(0xFFE4E8E4))
            )
            Spacer(Modifier.width(9.dp))
            FilledIconButton(onClick = onSend, enabled = enabled && value.isNotBlank(), modifier = Modifier.size(50.dp), colors = IconButtonDefaults.filledIconButtonColors(containerColor = Forest)) {
                Text("↑", color = Color.White, fontSize = 23.sp)
            }
        }
    }
}
