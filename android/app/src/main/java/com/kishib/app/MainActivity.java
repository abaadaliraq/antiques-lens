package com.kishib.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
  private static final String TAG = "KISHIBSocialLogin";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(SocialLoginPlugin.class);
    super.onCreate(savedInstanceState);
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (
      requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN ||
      requestCode > GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX
    ) {
      return;
    }

    if (getBridge() == null) {
      Log.e(TAG, "Bridge is null while handling Google login result.");
      return;
    }

    PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
    if (pluginHandle == null) {
      Log.e(TAG, "SocialLogin plugin handle is null.");
      return;
    }

    Plugin plugin = pluginHandle.getInstance();
    if (!(plugin instanceof SocialLoginPlugin)) {
      Log.e(TAG, "SocialLogin plugin instance is unavailable or invalid.");
      return;
    }

    ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
  }

  @Override
  public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
