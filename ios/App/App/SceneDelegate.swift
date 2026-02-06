//
//  SceneDelegate.swift
//  App
//
//  Created by Abdallah elIzmirli on 05/02/2026.
//

import GoogleSignIn
import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let _ = (scene as? UIWindowScene) else { return }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        
        // Handle Google Sign-In specifically
        if GIDSignIn.sharedInstance.handle(url) { return }
        
        // Otherwise forward to Capacitor
        ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }
    
    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}
