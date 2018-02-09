package mcguffin.android.simplewireframesketcher;

import android.support.v7.app.AppCompatActivity;

import android.os.Bundle;
import android.app.Activity;
import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends /*AppCompatActivity*/ Activity {

	MultitouchFramework mf;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
		// fullscreen
		getWindow().setFlags( WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN );
		requestWindowFeature( Window.FEATURE_NO_TITLE );

		mf = new MultitouchFramework( this );
		setContentView( mf );

		mf.requestFocus();
    }
}
