package com.travelmate.ai.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.travelmate.ai.data.DemoTravelAssistant
import com.travelmate.ai.data.TravelAssistant
import com.travelmate.ai.data.TravelPlan
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TravelUiState(
    val input: String = "",
    val userMessage: String? = null,
    val isPlanning: Boolean = false,
    val plan: TravelPlan? = null,
    val error: String? = null
)

class TravelViewModel(
    private val assistant: TravelAssistant = DemoTravelAssistant()
) : ViewModel() {
    private val _state = MutableStateFlow(TravelUiState())
    val state: StateFlow<TravelUiState> = _state.asStateFlow()

    fun updateInput(value: String) { _state.value = _state.value.copy(input = value) }

    fun send(example: String? = null) {
        val message = example ?: _state.value.input.trim()
        if (message.isBlank() || _state.value.isPlanning) return
        _state.value = _state.value.copy(input = "", userMessage = message, isPlanning = true, plan = null, error = null)
        viewModelScope.launch {
            runCatching { assistant.plan(message) }
                .onSuccess { _state.value = _state.value.copy(isPlanning = false, plan = it) }
                .onFailure { _state.value = _state.value.copy(isPlanning = false, error = "规划失败，请稍后重试") }
        }
    }
}
