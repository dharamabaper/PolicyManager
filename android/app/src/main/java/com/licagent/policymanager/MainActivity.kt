package com.licagent.policymanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.licagent.policymanager.ui.PolicyManagerApp

/**
 * Policy Manager - Agent Android Mobile Application
 * Written in Pure Kotlin with Jetpack Compose (Material 3).
 * Compatible across all Android versions from Android 8.0 (API 26) through Android 15 (API 35).
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PolicyManagerApp()
                }
            }
        }
    }
}
