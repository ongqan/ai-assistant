package com.travelmate.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.travelmate.ai.ui.TravelMateApp
import com.travelmate.ai.ui.TravelTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { TravelTheme { TravelMateApp() } }
    }
}

